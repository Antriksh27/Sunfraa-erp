import { getCurrentUserAndProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import ReportsHubView from './ReportsHubView';
import { Project, Invoice, StockLedger, ItemMaster } from '@/types/database';
import { BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR' && profile.role !== 'SALES' && profile.role !== 'ACCOUNTS') {
    redirect('/');
  }

  const supabase = createClient();

  // 1. Fetch Projects with BOM items for margin intelligence
  const { data: projectsData } = await supabase
    .from('projects')
    .select(`
      *,
      boms(id, items:bom_items(*))
    `)
    .order('created_at', { ascending: false });

  const projects = (projectsData as any[]) || [];

  // 2. Fetch Invoices with Client Names
  const { data: invoicesData } = await supabase
    .from('invoices')
    .select(`
      *,
      project:projects(client_name)
    `)
    .order('issued_at', { ascending: false });

  const invoices = (invoicesData as any[]) || [];

  // 3. Fetch Stock Ledger
  const { data: stockData } = await supabase
    .from('stock_ledger')
    .select('*')
    .order('created_at', { ascending: false });

  const stockLedger = (stockData as StockLedger[]) || [];

  // 4. Fetch Items Master
  const { data: itemsData } = await supabase
    .from('items_master')
    .select('*')
    .order('item_code', { ascending: true });

  const itemsMaster = (itemsData as ItemMaster[]) || [];

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="space-y-6">
        <PageHeader
          moduleNumber={8}
          moduleName="Business Intelligence & Audit Hub"
          title="Executive Operations & Financial Reports"
          description="Real-time pipeline conversion funnels, aging accounts receivables, construction velocity benchmarks, category margins, and inventory consumption."
          badgeColor="bg-purple-600"
        />

        <ReportsHubView
          projects={projects}
          invoices={invoices}
          stockLedger={stockLedger}
          itemsMaster={itemsMaster}
          userRole={profile.role}
        />
      </div>
    </AppShell>
  );
}
