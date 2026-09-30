import { getCurrentUserAndProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import UniversalExecutionDashboardView from './UniversalExecutionDashboardView';

export const dynamic = 'force-dynamic';

export default async function ExecutionOverviewPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  // Role Gate: Accessible to HEAD_ENGINEER and DIRECTOR only
  if (profile.role !== 'HEAD_ENGINEER' && profile.role !== 'DIRECTOR') {
    redirect('/');
  }

  const supabase = createClient();

  // 1. Fetch active execution projects across the company
  // Projects that are approved by Director or in execution stages
  const { data: projectsData } = await supabase
    .from('projects')
    .select(`
      *,
      progress:execution_stage_progress(*),
      lead_owner:profiles!projects_lead_owner_id_fkey(name, email),
      survey_assigned_engineer:profiles!projects_survey_assigned_engineer_id_fkey(name, phone),
      bom:boms(id, approved_at, approved_by_id, items:bom_items(*))
    `)
    .not('director_approved_at', 'is', null)
    .not('stage', 'in', '("CONNECTED","CLOSED","STALE","LEAD")')
    .order('director_approved_at', { ascending: false });

  // 2. Fetch labour assignments (recent and active deployments)
  const { data: labourAssignmentsData } = await supabase
    .from('labour_assignments')
    .select(`
      *,
      project:projects(id, client_name, address, kw_required, category),
      subcontractor:subcontractors(id, name, phone, trade),
      labour_team:labour_teams(id, name, headcount, available)
    `)
    .order('assigned_date', { ascending: false })
    .limit(100);

  // 3. Fetch subcontractors
  const { data: subcontractorsData } = await supabase
    .from('subcontractors')
    .select('*')
    .order('name', { ascending: true });

  // 4. Fetch labour teams
  const { data: labourTeamsData } = await supabase
    .from('labour_teams')
    .select('*')
    .order('name', { ascending: true });

  // 5. Fetch team members (profiles) for workload heatmap
  const { data: teamMembersData } = await supabase
    .from('profiles')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  const canEdit = profile.role === 'DIRECTOR';

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="space-y-6">
        <PageHeader
          moduleName="Universal Engineering Control"
          title="Universal Execution Overview Dashboard"
          description="Company-wide visibility across all active solar execution sites, 4-stage technical verification, subcontractor labour deployment, and engineering capacity."
          badgeColor="bg-[#0284c7]"
        />

        <UniversalExecutionDashboardView
          projects={projectsData || []}
          labourAssignments={labourAssignmentsData || []}
          subcontractors={subcontractorsData || []}
          labourTeams={labourTeamsData || []}
          teamMembers={teamMembersData || []}
          canEdit={canEdit}
          currentUserRole={profile.role}
        />
      </div>
    </AppShell>
  );
}
