import { getCurrentUserAndProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import AccountsDashboardView from './AccountsDashboardView';

import PageHeader from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR' && profile.role !== 'ACCOUNTS') {
    redirect('/');
  }

  const supabase = createClient();

  // Accounts & Director have read access to all projects
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      lead_owner:profiles!projects_lead_owner_id_fkey(name),
      payment_collected_by:profiles!projects_payment_collected_by_id_fkey(name)
    `)
    .order('created_at', { ascending: false });

  // Fetch all payment milestones
  const { data: milestones, error: mErr } = await supabase
    .from('payment_milestones')
    .select('*')
    .order('created_at', { ascending: true });

  // Fetch all invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .order('issued_at', { ascending: false });

  const isAuthorized = profile.role === 'ACCOUNTS' || profile.role === 'DIRECTOR';

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="space-y-6">
        <PageHeader
          moduleNumber={2}
          moduleName="Commercial & Accounts Ledger"
          title="Billing Milestones & Receivables Control"
          description="Milestone payment schedules, verified transaction receipts, aging receivables analysis, and GST tax invoicing operations."
          badgeColor="bg-[#16a34a]"
        />

        <AccountsDashboardView
          projects={projects || []}
          milestones={milestones || []}
          invoices={invoices || []}
          isAuthorized={isAuthorized}
        />
      </div>
    </AppShell>
  );
}
