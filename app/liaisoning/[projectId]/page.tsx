import { createClient } from '@/lib/supabase/server';
import { getCurrentUserAndProfile } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { getProjectUrlForRole } from '@/lib/navigation';
import LiaisoningWorkspace from './LiaisoningWorkspace';
import ProjectCommentsSection from '@/components/ProjectCommentsSection';
import ConsolidatedActivityTimeline from '@/components/ConsolidatedActivityTimeline';
import { ArrowLeft, Building2, Zap, Phone, MapPin } from 'lucide-react';
import {
  Project,
  LiaisoningRecord,
  CEIRecord,
  DesignFile,
  DISCOMPortalRecord,
  CEIInspectorLog,
  MeterTestRecord,
  SubsidyClaim,
} from '@/types/database';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    projectId: string;
  };
}

export default async function ProjectLiaisoningPage({ params }: Props) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR' && profile.role !== 'LIAISONING') {
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

  // 2. Fetch Liaisoning Record
  const { data: liaisoningData } = await supabase
    .from('liaisoning_records')
    .select(`
      *,
      follow_up_logs:discom_follow_up_logs(*)
    `)
    .eq('project_id', project.id)
    .maybeSingle();

  const liaisoningRecord = liaisoningData as any;

  // 3. Fetch CEI Record (if CEI required)
  let ceiRecord: CEIRecord | null = null;
  if (project.cei_required) {
    const { data: ceiData } = await supabase
      .from('cei_records')
      .select('*')
      .eq('project_id', project.id)
      .maybeSingle();

    ceiRecord = ceiData as CEIRecord | null;
  }

  // 4. Fetch Live CEI Drawings from Module 5
  const { data: ceiDrawingsData } = await supabase
    .from('design_files')
    .select('*')
    .eq('project_id', project.id)
    .eq('type', 'CEI_DRAWING')
    .order('version', { ascending: false });

  const ceiDrawings = (ceiDrawingsData as DesignFile[]) || [];

  // 5. Fetch DISCOM Portal Records
  const { data: discomData } = await supabase
    .from('discom_portal_records')
    .select('*')
    .eq('project_id', project.id)
    .order('applied_at', { ascending: false });

  const discomRecords = (discomData as DISCOMPortalRecord[]) || [];

  // 6. Fetch CEI Inspector Logs
  const { data: inspectorData } = await supabase
    .from('cei_inspector_logs')
    .select('*')
    .eq('project_id', project.id)
    .order('scheduled_date', { ascending: false });

  const inspectorLogs = (inspectorData as CEIInspectorLog[]) || [];

  // 7. Fetch Meter Test Records
  const { data: meterData } = await supabase
    .from('meter_test_records')
    .select('*')
    .eq('project_id', project.id)
    .order('test_date', { ascending: false });

  const meterRecords = (meterData as MeterTestRecord[]) || [];

  // 8. Fetch Subsidy Claims
  const { data: subsidyData } = await supabase
    .from('subsidy_claims')
    .select('*')
    .eq('project_id', project.id)
    .order('claim_submitted_at', { ascending: false });

  const subsidyClaims = (subsidyData as SubsidyClaim[]) || [];

  // 9. Fetch Comments & Profiles & Reassignments
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

  const canEdit = profile.role === 'LIAISONING' || profile.role === 'DIRECTOR';

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/liaisoning"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#5f6570] hover:text-[#181d26]"
            >
              <ArrowLeft className="h-4 w-4" />
              Liaisoning Queue
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#882400]">
                  DISCOM & CEI Liaisoning
                </span>
                <span className="rounded bg-[#fff0eb] px-2 py-0.5 text-[10px] font-bold text-[#882400] border border-[#fcab79]">
                  {project.stage.replace(/_/g, ' ')}
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#181d26]">{project.client_name}</h2>
            </div>
          </div>

          {profile.role === 'DIRECTOR' && (
            <div className="flex items-center gap-2 text-xs">
              <Link
                href={`/pipeline/${project.id}`}
                className="rounded-lg border border-[#e0e2e6] bg-white px-3 py-1.5 font-medium text-[#181d26] shadow-2xs hover:bg-[#fafbfc]"
              >
                Sales Dossier
              </Link>
              <Link
                href={`/execution/${project.id}`}
                className="rounded-lg border border-[#e0e2e6] bg-white px-3 py-1.5 font-medium text-[#181d26] shadow-2xs hover:bg-[#fafbfc]"
              >
                Execution Status
              </Link>
            </div>
          )}
        </div>

        {/* Liaisoning Workspace */}
        <LiaisoningWorkspace
          project={project}
          liaisoningRecord={liaisoningRecord}
          ceiRecord={ceiRecord}
          ceiDrawings={ceiDrawings}
          discomRecords={discomRecords}
          inspectorLogs={inspectorLogs}
          meterRecords={meterRecords}
          subsidyClaims={subsidyClaims}
          canEdit={canEdit}
        />

        {/* Cross-Module Discussions & Activity Feed */}
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
