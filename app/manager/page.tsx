import { getCurrentUserAndProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import ManagerDashboardView from './ManagerDashboardView';
import { Project, Profile, ReassignmentLog } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function ManagerControlPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR') {
    redirect('/');
  }

  const supabase = createClient();

  // 1. Fetch active projects
  const { data: projectsData } = await supabase
    .from('projects')
    .select(`
      *,
      lead_owner:profiles!projects_lead_owner_id_fkey(name, role)
    `)
    .not('stage', 'in', '("CONNECTED","CLOSED")')
    .order('updated_at', { ascending: false });

  const projects = (projectsData as any[]) || [];

  // 2. Fetch team members (profiles)
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  const teamMembers = (profilesData as Profile[]) || [];

  // 3. Fetch reassignment audit logs
  const { data: logsData } = await supabase
    .from('reassignment_logs')
    .select(`
      *,
      project:projects(client_name),
      reassigned_from:profiles!reassignment_logs_reassigned_from_id_fkey(name),
      reassigned_to:profiles!reassignment_logs_reassigned_to_id_fkey(name),
      reassigned_by:profiles!reassignment_logs_reassigned_by_id_fkey(name)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  const reassignmentLogs = (logsData as any[]) || [];

  const canEdit = profile.role === 'DIRECTOR';

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="space-y-6">
        <PageHeader
          moduleNumber={7}
          moduleName="Manager Control & SLA Dispatch"
          title="Departmental SLAs & Workload Balancing"
          description="Departmental SLA health indexes, team capacity heatmaps, top-10 intervention queue, and reassignment audit controls."
          badgeColor="bg-[#aa2d00]"
        />

        <ManagerDashboardView
          projects={projects}
          teamMembers={teamMembers}
          reassignmentLogs={reassignmentLogs}
          canEdit={canEdit}
        />
      </div>
    </AppShell>
  );
}
