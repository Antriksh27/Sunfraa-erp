import { getCurrentUserAndProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import ExecutionQueueView from './ExecutionQueueView';

export const dynamic = 'force-dynamic';

export default async function ExecutionPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR' && profile.role !== 'SITE_EXECUTION') {
    redirect('/');
  }

  const supabase = createClient();

  // Query projects that have been approved by Director and are not yet completed
  const { data: rawProjects, error } = await supabase
    .from('projects')
    .select(`
      *,
      progress:execution_stage_progress(stage, photo_url, comment, completed_at),
      lead_owner:profiles!projects_lead_owner_id_fkey(name),
      execution_completion:execution_completions(id)
    `)
    .not('director_approved_at', 'is', null)
    .not('stage', 'in', '("CONNECTED","CLOSED")')
    .order('director_approved_at', { ascending: false });

  // Filter out projects that have submitted their final execution completion dossier
  const projects = (rawProjects || []).filter((p: any) => {
    const hasDossier = p.execution_completion && (p.execution_completion.id || (Array.isArray(p.execution_completion) && p.execution_completion.length > 0));
    return !hasDossier;
  });

  // Query today's active deployments
  const todayDate = new Date().toISOString().split('T')[0];
  const { data: todaysDeployments } = await supabase
    .from('labour_assignments')
    .select(`
      *,
      project:projects(client_name, address),
      subcontractor:subcontractors(name, phone, trade),
      labour_team:labour_teams(name)
    `)
    .eq('assigned_date', todayDate);

  // Fetch all active subcontractors
  const { data: subcontractors } = await supabase
    .from('subcontractors')
    .select('*')
    .order('name', { ascending: true });

  // Query projects with scheduled site surveys (pre-execution technical surveys)
  const { data: scheduledSurveys } = await supabase
    .from('projects')
    .select(`
      *,
      lead_owner:profiles!projects_lead_owner_id_fkey(name, phone),
      survey_assigned_engineer:profiles!projects_survey_assigned_engineer_id_fkey(name, phone)
    `)
    .eq('stage', 'SITE_SURVEY_SCHEDULED')
    .order('survey_scheduled_date', { ascending: true });

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="space-y-6">
        <PageHeader
          moduleNumber={3}
          moduleName="Project Execution & Handover"
          title="Civil & Electrical Site Workflows"
          description="Director-approved solar sites, subcontractor labour deployment, 5-stage milestone sign-offs, Daily Progress Reports (DPR), and handover dossiers."
          badgeColor="bg-[#16a34a]"
        />

        <ExecutionQueueView
          projects={projects || []}
          todaysDeployments={todaysDeployments || []}
          subcontractors={subcontractors || []}
          scheduledSurveys={scheduledSurveys || []}
        />
      </div>
    </AppShell>
  );
}
