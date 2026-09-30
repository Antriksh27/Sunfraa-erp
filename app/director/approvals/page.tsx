import { getCurrentUserAndProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import DirectorApprovalsView from './DirectorApprovalsView';

export const dynamic = 'force-dynamic';

export default async function DirectorApprovalsPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR') {
    redirect('/');
  }

  const supabase = createClient();

  // 1. Projects pending Director approval: payment collected or in payment stages, not yet approved
  const { data: pendingProjects } = await supabase
    .from('projects')
    .select(`
      *,
      lead_owner:profiles!projects_lead_owner_id_fkey(name),
      boms(id, items:bom_items(*)),
      site_surveys(*),
      design_files(*),
      payment_milestones(*),
      audit_logs:approval_audit_logs(*, actor:profiles!approval_audit_logs_actor_id_fkey(name))
    `)
    .in('payment_status', ['COLLECTED', 'PARTIAL'])
    .is('director_approved_at', null)
    .order('created_at', { ascending: false });

  // 2. Projects approved by Director
  const { data: approvedProjects } = await supabase
    .from('projects')
    .select(`
      *,
      lead_owner:profiles!projects_lead_owner_id_fkey(name)
    `)
    .not('director_approved_at', 'is', null)
    .order('director_approved_at', { ascending: false })
    .limit(15);

  // 3. Recent Audit Logs
  const { data: recentAuditLogs } = await supabase
    .from('approval_audit_logs')
    .select(`
      *,
      project:projects(client_name),
      actor:profiles!approval_audit_logs_actor_id_fkey(name)
    `)
    .order('created_at', { ascending: false })
    .limit(30);

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="space-y-6">
        <PageHeader
          moduleNumber={7}
          moduleName="Director Approvals & Governance"
          title="Executive Gateway & Site Construction Authorization"
          description="360° commercial margin intelligence, technical feasibility review, rejection workflows, and batch site authorization."
          badgeColor="bg-purple-600"
        />

        <DirectorApprovalsView
          pendingProjects={(pendingProjects as any) || []}
          approvedProjects={(approvedProjects as any) || []}
          recentAuditLogs={(recentAuditLogs as any) || []}
        />
      </div>
    </AppShell>
  );
}
