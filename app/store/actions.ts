'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ItemCategory, ItemUnit, SupplierPaymentTerms } from '@/types/database';

export async function addBOMItemAction(bomId: string, projectId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const itemName = formData.get('itemName') as string;
  const category = formData.get('category') as string;
  const quantity = parseFloat(formData.get('quantity') as string);
  const unit = formData.get('unit') as string;

  if (!itemName || !category || isNaN(quantity) || quantity <= 0 || !unit) {
    return { error: 'Please provide Item Name, Category, valid Quantity, and Unit.' };
  }

  const { error } = await supabase.from('bom_items').insert({
    bom_id: bomId,
    item_name: itemName,
    category,
    quantity,
    unit,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/store');
  revalidatePath(`/execution/${projectId}`);
  return { success: true };
}

export async function deleteBOMItemAction(itemId: string, projectId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('bom_items').delete().eq('id', itemId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/store');
  revalidatePath(`/execution/${projectId}`);
  return { success: true };
}

export async function approveBOMAction(bomId: string, projectId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized. Please log in.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'HEAD_ENGINEER' && profile?.role !== 'DIRECTOR') {
    return { error: 'Unauthorized: Only HEAD_ENGINEER or DIRECTOR can approve BOMs.' };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('boms')
    .update({
      approved_at: now,
      approved_by_id: user.id,
    })
    .eq('id', bomId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/store');
  revalidatePath('/execution-overview');
  revalidatePath(`/execution/${projectId}`);
  return { success: true };
}

export async function recordStockInAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const itemName = formData.get('itemName') as string;
  const quantity = parseFloat(formData.get('quantity') as string);

  if (!itemName || isNaN(quantity) || quantity <= 0) {
    return { error: 'Please specify an Item Name and valid Quantity.' };
  }

  const { error } = await supabase.from('stock_ledger').insert({
    item_name: itemName,
    direction: 'IN',
    quantity,
    project_id: null,
    delivery_challan_id: null,
    created_by_id: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/store');
  return { success: true };
}

export async function createChallanAndDispatchAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const projectId = formData.get('projectId') as string;
  const vehicleType = formData.get('vehicleType') as string;
  const registrationNumber = formData.get('registrationNumber') as string;
  const driverName = formData.get('driverName') as string;
  const driverMobile = formData.get('driverMobile') as string;
  const distance = parseFloat(formData.get('distance') as string);
  const itemsRaw = formData.get('dispatchItems') as string;

  let dispatchItems: { itemName: string; quantity: number }[] = [];
  try {
    dispatchItems = JSON.parse(itemsRaw);
  } catch {
    dispatchItems = [];
  }

  if (
    !projectId ||
    !vehicleType ||
    !registrationNumber ||
    !driverName ||
    !driverMobile ||
    isNaN(distance) ||
    distance <= 0
  ) {
    return { error: 'Please provide all vehicle, driver, and destination details.' };
  }

  if (!dispatchItems || dispatchItems.length === 0) {
    return { error: 'Please specify at least 1 item to dispatch.' };
  }

  // 1. Create Delivery Challan
  const { data: challan, error: challanError } = await supabase
    .from('delivery_challans')
    .insert({
      project_id: projectId,
      vehicle_type: vehicleType,
      registration_number: registrationNumber,
      driver_name: driverName,
      driver_mobile: driverMobile,
      distance,
      created_by_id: user.id,
    })
    .select('id')
    .single();

  if (challanError || !challan) {
    return { error: challanError?.message || 'Failed to create Delivery Challan.' };
  }

  // 2. Insert Stock OUT ledger rows referencing the newly created Delivery Challan (Business Rule 10)
  const ledgerRows = dispatchItems.map((item) => ({
    item_name: item.itemName,
    direction: 'OUT' as const,
    quantity: item.quantity,
    project_id: projectId,
    delivery_challan_id: challan.id,
    created_by_id: user.id,
  }));

  const { error: ledgerError } = await supabase.from('stock_ledger').insert(ledgerRows);

  if (ledgerError) {
    // If ledger insert fails, clean up challan to maintain atomic consistency
    await supabase.from('delivery_challans').delete().eq('id', challan.id);
    return { error: `Stock OUT failed (Business Rule 10): ${ledgerError.message}` };
  }

  revalidatePath('/store');
  revalidatePath(`/execution/${projectId}`);
  return { success: true };
}

// ----------------- ITEM MASTER ACTIONS -----------------

export async function createItemMasterAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const itemCode = (formData.get('itemCode') as string)?.trim();
  const name = (formData.get('name') as string)?.trim();
  const category = formData.get('category') as ItemCategory;
  const unit = (formData.get('unit') as ItemUnit) || 'NOS';
  const hsnCode = (formData.get('hsnCode') as string)?.trim() || null;
  const gstRate = parseFloat(formData.get('gstRate') as string) || 18;
  const reorderPoint = parseFloat(formData.get('reorderPoint') as string) || 10;
  const minOrderQty = parseFloat(formData.get('minOrderQty') as string) || 1;
  const standardCost = parseFloat(formData.get('standardCost') as string) || 0;

  if (!itemCode || !name || !category) {
    return { error: 'Please provide Item Code, Name, and Category.' };
  }

  const { error } = await supabase.from('items_master').insert({
    item_code: itemCode,
    name,
    category,
    unit,
    hsn_code: hsnCode,
    gst_rate: gstRate,
    reorder_point: reorderPoint,
    min_order_qty: minOrderQty,
    standard_cost: standardCost,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath('/store');
  return { success: true };
}

export async function toggleItemMasterActiveAction(id: string, isActive: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from('items_master')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/store');
  return { success: true };
}

// ----------------- SUPPLIER ACTIONS -----------------

export async function createSupplierAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const name = (formData.get('name') as string)?.trim();
  const contactPerson = (formData.get('contactPerson') as string)?.trim() || null;
  const phone = (formData.get('phone') as string)?.trim();
  const email = (formData.get('email') as string)?.trim() || null;
  const gstin = (formData.get('gstin') as string)?.trim() || null;
  const city = (formData.get('city') as string)?.trim() || 'Ahmedabad';
  const paymentTerms = (formData.get('paymentTerms') as SupplierPaymentTerms) || 'NET_30';
  const rating = parseInt(formData.get('rating') as string, 10) || 5;

  if (!name || !phone) {
    return { error: 'Supplier Name and Phone are required.' };
  }

  const { error } = await supabase.from('suppliers').insert({
    name,
    contact_person: contactPerson,
    phone,
    email,
    gstin,
    city,
    payment_terms: paymentTerms,
    rating,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath('/store');
  return { success: true };
}

export async function toggleSupplierActiveAction(id: string, isActive: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/store');
  return { success: true };
}
