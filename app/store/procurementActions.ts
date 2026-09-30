'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { POStatus } from '@/types/database';

export async function createPurchaseOrderAction(
  supplierId: string,
  items: Array<{
    itemMasterId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>,
  notes?: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  if (!supplierId || !items || items.length === 0) {
    return { error: 'Please select a supplier and at least one line item.' };
  }

  // Calculate totals
  let subtotal = 0;
  let totalTax = 0;

  items.forEach((itm) => {
    const lineTotal = itm.quantity * itm.unitPrice;
    const lineTax = (lineTotal * itm.taxRate) / 100;
    subtotal += lineTotal;
    totalTax += lineTax;
  });

  const totalAmount = subtotal + totalTax;

  // Generate PO number: PO-YYYY-XXXX
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const poNumber = `PO-${year}-${randomSuffix}`;

  // Insert PO header
  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .insert({
      po_number: poNumber,
      supplier_id: supplierId,
      status: 'ISSUED',
      total_amount: totalAmount,
      tax_amount: totalTax,
      issued_at: new Date().toISOString(),
      created_by_id: user.id,
      notes: notes || null,
    })
    .select('id, po_number')
    .single();

  if (poError || !po) {
    return { error: poError?.message || 'Failed to create Purchase Order.' };
  }

  // Insert PO line items
  const lineItems = items.map((itm) => ({
    po_id: po.id,
    item_master_id: itm.itemMasterId,
    item_name: itm.itemName,
    quantity: itm.quantity,
    unit_price: itm.unitPrice,
    tax_rate: itm.taxRate,
    amount: itm.quantity * itm.unitPrice,
    quantity_received: 0,
  }));

  const { error: itemsError } = await supabase.from('po_items').insert(lineItems);

  if (itemsError) {
    return { error: itemsError.message };
  }

  revalidatePath('/store');
  return { success: true, poId: po.id, poNumber: po.po_number };
}

export async function createGoodsReceiptNoteAction(
  poId: string,
  receivedItems: Array<{
    poItemId: string;
    itemName: string;
    quantityReceived: number;
    quantityRejected: number;
    remarks?: string;
  }>,
  notes?: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  if (!poId || !receivedItems || receivedItems.length === 0) {
    return { error: 'Please select items to receive into warehouse.' };
  }

  // Generate GRN Number: GRN-YYYY-XXXX
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const grnNumber = `GRN-${year}-${randomSuffix}`;
  const today = new Date().toISOString().split('T')[0];

  // 1. Insert GRN header
  const { data: grn, error: grnError } = await supabase
    .from('goods_receipt_notes')
    .insert({
      grn_number: grnNumber,
      po_id: poId,
      received_date: today,
      received_by_id: user.id,
      notes: notes || null,
    })
    .select('id, grn_number')
    .single();

  if (grnError || !grn) {
    return { error: grnError?.message || 'Failed to create Goods Receipt Note.' };
  }

  // 2. Insert GRN line items
  const grnLines = receivedItems.map((itm) => ({
    grn_id: grn.id,
    po_item_id: itm.poItemId,
    quantity_received: itm.quantityReceived,
    quantity_rejected: itm.quantityRejected || 0,
    remarks: itm.remarks || null,
  }));

  const { error: linesError } = await supabase.from('grn_items').insert(grnLines);

  if (linesError) {
    return { error: linesError.message };
  }

  // 3. Update po_items received quantities & insert stock_ledger rows (direction: IN)
  for (const item of receivedItems) {
    if (item.quantityReceived > 0) {
      // Fetch existing quantity_received
      const { data: currentPOItem } = await supabase
        .from('po_items')
        .select('quantity_received, quantity')
        .eq('id', item.poItemId)
        .single();

      const newReceivedTotal = (Number(currentPOItem?.quantity_received) || 0) + item.quantityReceived;

      await supabase
        .from('po_items')
        .update({ quantity_received: newReceivedTotal })
        .eq('id', item.poItemId);

      // Auto-insert stock_ledger IN row (Business Rule 10 / Requirement 5)
      await supabase.from('stock_ledger').insert({
        item_name: item.itemName,
        direction: 'IN',
        quantity: item.quantityReceived,
        project_id: null,
        delivery_challan_id: null,
        created_by_id: user.id,
      });
    }
  }

  // 4. Check if all items for this PO are fully received
  const { data: allPoItems } = await supabase
    .from('po_items')
    .select('quantity, quantity_received')
    .eq('po_id', poId);

  let allCompleted = true;
  let anyReceived = false;

  allPoItems?.forEach((p) => {
    if (Number(p.quantity_received) < Number(p.quantity)) {
      allCompleted = false;
    }
    if (Number(p.quantity_received) > 0) {
      anyReceived = true;
    }
  });

  const nextStatus: POStatus = allCompleted ? 'RECEIVED' : anyReceived ? 'PARTIALLY_RECEIVED' : 'ISSUED';

  await supabase
    .from('purchase_orders')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', poId);

  revalidatePath('/store');
  return { success: true, grnNumber: grn.grn_number, status: nextStatus };
}

export async function cancelPurchaseOrderAction(poId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('purchase_orders')
    .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
    .eq('id', poId);

  if (error) return { error: error.message };

  revalidatePath('/store');
  return { success: true };
}
