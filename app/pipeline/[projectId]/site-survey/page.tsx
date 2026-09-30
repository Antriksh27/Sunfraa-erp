import { createClient } from '@/lib/supabase/server';
import { getCurrentUserAndProfile } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import SiteSurveyForm from './SiteSurveyForm';
import SiteSurveyReadOnlyView from './SiteSurveyReadOnlyView';
import { Project, SiteSurvey } from '@/types/database';
import { getProjectUrlForRole } from '@/lib/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    projectId: string;
  };
}

export default async function SiteSurveyPage({ params }: Props) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR' && profile.role !== 'SITE_EXECUTION' && profile.role !== 'SALES') {
    redirect(getProjectUrlForRole(params.projectId, profile.role));
  }

  const supabase = createClient();

  const { data: projectData, error } = await supabase
    .from('projects')
    .select(`
      *,
      survey_assigned_engineer:profiles!projects_survey_assigned_engineer_id_fkey(name, phone)
    `)
    .eq('id', params.projectId)
    .single();

  if (error || !projectData) {
    notFound();
  }

  const project = projectData as any;

  const { data: surveyData } = await supabase
    .from('site_surveys')
    .select(`
      *,
      surveyed_by:profiles!site_surveys_surveyed_by_id_fkey(name)
    `)
    .eq('project_id', project.id)
    .maybeSingle();

  const existingSurvey = surveyData as (SiteSurvey & { surveyed_by?: { name: string } | null }) | null;

  // PRD Permission: Only SITE_EXECUTION and DIRECTOR have survey write/edit access
  // SALES (and other non-execution roles) get a read-only summary or awaiting-survey empty state
  const isExecutionOrDirector = profile.role === 'SITE_EXECUTION' || profile.role === 'DIRECTOR';

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      {isExecutionOrDirector ? (
        <SiteSurveyForm project={project} existingSurvey={existingSurvey} userRole={profile.role} />
      ) : (
        <SiteSurveyReadOnlyView
          project={project}
          existingSurvey={existingSurvey}
          userRole={profile.role}
        />
      )}
    </AppShell>
  );
}
