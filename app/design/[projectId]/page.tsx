import { createClient } from '@/lib/supabase/server';
import { getCurrentUserAndProfile } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { getProjectUrlForRole } from '@/lib/navigation';
import DesignWorkspace from './DesignWorkspace';
import ProjectCommentsSection from '@/components/ProjectCommentsSection';
import ConsolidatedActivityTimeline from '@/components/ConsolidatedActivityTimeline';
import { ArrowLeft, Compass, Zap, Phone, MapPin } from 'lucide-react';
import { Project, SiteSurvey, DesignFile, CEIChecklist, SLDSpecification } from '@/types/database';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    projectId: string;
  };
}

export default async function ProjectDesignStudioPage({ params }: Props) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR' && profile.role !== 'DESIGN') {
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

  // 2. Fetch Site Survey
  const { data: surveyData } = await supabase
    .from('site_surveys')
    .select(`
      *,
      surveyed_by:profiles!site_surveys_surveyed_by_id_fkey(name)
    `)
    .eq('project_id', project.id)
    .maybeSingle();

  const siteSurvey = surveyData as (SiteSurvey & { surveyed_by?: { name: string } | null }) | null;

  // 3. Fetch all Design Files for this project
  const { data: filesData } = await supabase
    .from('design_files')
    .select(`
      *,
      uploaded_by:profiles!design_files_uploaded_by_id_fkey(name)
    `)
    .eq('project_id', project.id)
    .order('version', { ascending: false });

  const designFiles = (filesData as any[]) || [];

  // 4. Fetch CEI Checklist
  const { data: ceiData } = await supabase
    .from('cei_checklists')
    .select('*')
    .eq('project_id', project.id)
    .maybeSingle();

  const ceiChecklist = ceiData as CEIChecklist | null;

  // 5. Fetch SLD Specifications
  const { data: sldData } = await supabase
    .from('sld_specifications')
    .select('*')
    .eq('project_id', project.id)
    .maybeSingle();

  const sldSpecification = sldData as SLDSpecification | null;

  // 6. Fetch Comments & Profiles
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

  const canEdit = profile.role === 'DESIGN' || profile.role === 'DIRECTOR';

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/design"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#5f6570] hover:text-[#181d26]"
            >
              <ArrowLeft className="h-4 w-4" />
              Design Queues
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">
                  Engineering CAD Studio
                </span>
                <span className="rounded bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-800 border border-cyan-200">
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
            </div>
          )}
        </div>

        {/* Design Workspace */}
        <DesignWorkspace
          project={project}
          siteSurvey={siteSurvey}
          designFiles={designFiles}
          ceiChecklist={ceiChecklist}
          sldSpecification={sldSpecification}
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
            designFiles={designFiles}
          />
        </div>
      </div>
    </AppShell>
  );
}
