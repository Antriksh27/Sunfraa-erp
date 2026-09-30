import { createClient } from '@/lib/supabase/server';
import { getCurrentUserAndProfile } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { getProjectUrlForRole } from '@/lib/navigation';
import ExecutionWorkflow from './ExecutionWorkflow';
import ProjectCommentsSection from '@/components/ProjectCommentsSection';
import ConsolidatedActivityTimeline from '@/components/ConsolidatedActivityTimeline';
import { ArrowLeft, HardHat, Phone, MapPin, Zap } from 'lucide-react';
import {
  Project,
  BOM,
  BOMItem,
  LabourTeam,
  LabourAssignment,
  ExecutionStageProgress,
  ExecutionCompletion,
} from '@/types/database';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    projectId: string;
  };
}

export default async function ProjectExecutionPage({ params }: Props) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR' && profile.role !== 'SITE_EXECUTION') {
    redirect(getProjectUrlForRole(params.projectId, profile.role));
  }

  const supabase = createClient();

  // 1. Fetch Project
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select(`
      *,
      lead_owner:profiles!projects_lead_owner_id_fkey(name)
    `)
    .eq('id', params.projectId)
    .single();

  if (projectError || !projectData) {
    notFound();
  }

  const project = projectData as Project;

  // 2. Fetch BOM & Items
  const { data: bomData } = await supabase
    .from('boms')
    .select(`
      *,
      items:bom_items(*)
    `)
    .eq('project_id', project.id)
    .maybeSingle();

  const bom = bomData as (BOM & { items?: BOMItem[] }) | null;

  // 3. Fetch Labour Teams & Subcontractors
  const { data: teamsData } = await supabase
    .from('labour_teams')
    .select('*')
    .order('name');

  const labourTeams = (teamsData as LabourTeam[]) || [];

  const { data: subsData } = await supabase
    .from('subcontractors')
    .select('*')
    .eq('is_active', true)
    .order('name');

  const subcontractors = (subsData as any[]) || [];

  // 4. Fetch Labour Assignments
  const { data: assignmentsData } = await supabase
    .from('labour_assignments')
    .select(`
      *,
      labour_team:labour_teams(name, headcount),
      subcontractor:subcontractors(name, phone, trade, rate_type, default_rate)
    `)
    .eq('project_id', project.id)
    .order('assigned_date', { ascending: false });

  const labourAssignments = (assignmentsData as any) || [];

  // 5. Fetch Stage Progress
  const { data: progressData } = await supabase
    .from('execution_stage_progress')
    .select(`
      *,
      completed_by:profiles!execution_stage_progress_completed_by_id_fkey(name)
    `)
    .eq('project_id', project.id)
    .order('completed_at', { ascending: true });

  const stageProgress = (progressData as ExecutionStageProgress[]) || [];

  // 6. Fetch Completion & Site Survey
  const { data: completionData } = await supabase
    .from('execution_completions')
    .select('*')
    .eq('project_id', project.id)
    .maybeSingle();

  const completion = completionData as ExecutionCompletion | null;

  const { data: surveyData } = await supabase
    .from('site_surveys')
    .select('*')
    .eq('project_id', project.id)
    .maybeSingle();

  // Fetch Comments & Profiles & Reassignments
  const { data: commentsData } = await supabase
    .from('project_comments')
    .select(`
      *,
      author:profiles!project_comments_author_id_fkey(name, role)
    `)
    .eq('project_id', project.id)
    .order('created_at', { ascending: true });

  const comments = (commentsData as any[]) || [];

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  const teamProfiles = (profilesData as any[]) || [];

  const { data: reassignmentsData } = await supabase
    .from('reassignment_logs')
    .select(`
      *,
      reassigned_from:profiles!reassignment_logs_reassigned_from_id_fkey(name),
      reassigned_to:profiles!reassignment_logs_reassigned_to_id_fkey(name),
      reassigned_by:profiles!reassignment_logs_reassigned_by_id_fkey(name)
    `)
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  const reassignments = (reassignmentsData as any[]) || [];

  const canEdit = profile.role === 'SITE_EXECUTION' || profile.role === 'DIRECTOR';

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/execution"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#5f6570] hover:text-[#181d26]"
            >
              <ArrowLeft className="h-4 w-4" />
              Execution Queue
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#aa2d00]">
                  Execution Workspace
                </span>
                <span className="rounded bg-[#fff0eb] px-2 py-0.5 text-[10px] font-bold text-[#882400] border border-[#fcab79]">
                  {project.stage.replace(/_/g, ' ')}
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#181d26]">{project.client_name}</h2>
            </div>
          </div>

          {profile.role === 'DIRECTOR' && (
            <div className="flex items-center gap-2">
              <Link
                href={`/pipeline/${project.id}`}
                className="rounded border border-[#e0e2e6] bg-white px-3 py-1.5 text-xs font-semibold text-[#181d26] hover:bg-[#f8fafc]"
              >
                View Pipeline Details
              </Link>
            </div>
          )}
        </div>

        {/* Execution Workflow Component */}
        <ExecutionWorkflow
          project={project}
          survey={surveyData}
          bom={bom}
          labourTeams={labourTeams}
          subcontractors={subcontractors}
          labourAssignments={labourAssignments}
          stageProgress={stageProgress}
          completion={completion}
          canEdit={canEdit}
        />

        {/* Cross-Module Discussions & Consolidated Activity Feed */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ProjectCommentsSection
            projectId={project.id}
            comments={comments}
            teamMembers={teamProfiles}
            currentUserId={user.id}
            canEdit={canEdit}
          />
          <ConsolidatedActivityTimeline
            comments={comments}
            reassignments={reassignments}
          />
        </div>
      </div>
    </AppShell>
  );
}
