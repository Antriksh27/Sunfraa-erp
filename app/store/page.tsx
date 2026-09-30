import { getCurrentUserAndProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import StoreManagementView from './StoreManagementView';
import { BOM, BOMItem, StockLedger, DeliveryChallan, Project } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function StorePage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR' && profile.role !== 'STORE_PURCHASE') {
    redirect('/');
  }

  const supabase = createClient();

  // 1. Fetch BOMs with project details and existing items
  const { data: bomsData } = await supabase
    .from('boms')
    .select(`
      *,
      project:projects(*),
      items:bom_items(*)
    `)
    .order('created_at', { ascending: false });

  const boms = (bomsData as any[]) || [];

  // 2. Fetch full Stock Ledger
  const { data: stockLedgerData } = await supabase
    .from('stock_ledger')
    .select('*')
    .order('created_at', { ascending: false });

  const stockLedger = (stockLedgerData as StockLedger[]) || [];

  // 3. Fetch Recent Challans
  const { data: challansData } = await supabase
    .from('delivery_challans')
    .select(`
      *,
      project:projects(client_name, address, kw_required)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  const recentChallans = (challansData as any[]) || [];

  // 4. Fetch Active Approved Projects for Dispatch Selection
  const { data: activeProjectsData } = await supabase
    .from('projects')
    .select('*')
    .not('director_approved_at', 'is', null)
    .not('stage', 'in', '("CONNECTED","CLOSED")')
    .order('created_at', { ascending: false });

  const activeProjects = (activeProjectsData as Project[]) || [];

  // 5. Fetch Items Master
  const { data: itemsMasterData } = await supabase
    .from('items_master')
    .select('*')
    .order('item_code', { ascending: true });

  const itemsMaster = (itemsMasterData as any[]) || [];

  // 6. Fetch Suppliers
  const { data: suppliersData } = await supabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true });

  const suppliers = (suppliersData as any[]) || [];

  // 7. Fetch Purchase Orders
  const { data: poData } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      supplier:suppliers(*),
      items:po_items(*)
    `)
    .order('issued_at', { ascending: false });

  const purchaseOrders = (poData as any[]) || [];

  // 8. Fetch Goods Receipt Notes (GRN)
  const { data: grnData } = await supabase
    .from('goods_receipt_notes')
    .select(`
      *,
      po:purchase_orders(po_number, supplier:suppliers(name)),
      items:grn_items(*),
      received_by:profiles!goods_receipt_notes_received_by_id_fkey(name)
    `)
    .order('received_date', { ascending: false });

  const grnList = (grnData as any[]) || [];

  const canEdit = profile.role === 'STORE_PURCHASE' || profile.role === 'DIRECTOR';

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="space-y-6">
        <PageHeader
          moduleNumber={4}
          moduleName="Store & Purchase Management"
          title="BOM Bill of Materials & Inventory Control"
          description="BOM line items configuration, warehouse stock ledger, purchase orders, GRN receipt verification, items catalog, and vendor directory."
          badgeColor="bg-orange-500"
        />

        <StoreManagementView
          boms={boms}
          stockLedger={stockLedger}
          recentChallans={recentChallans}
          activeProjects={activeProjects}
          itemsMaster={itemsMaster}
          suppliers={suppliers}
          purchaseOrders={purchaseOrders}
          grnList={grnList}
          canEdit={canEdit}
        />
      </div>
    </AppShell>
  );
}
