import { createClient } from '@/lib/supabase/server';
import { getCurrentUserAndProfile } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { getProjectUrlForRole } from '@/lib/navigation';
import LeadMetadataEditor from './LeadMetadataEditor';
import QuotationSection from './QuotationSection';
import FollowUpSection from './FollowUpSection';
import LeadActivityTimeline from './LeadActivityTimeline';
import DocumentChecklistSection from './DocumentChecklistSection';
import ProjectCommentsSection from '@/components/ProjectCommentsSection';
import ConsolidatedActivityTimeline from '@/components/ConsolidatedActivityTimeline';
import {
  ArrowLeft,
  Camera,
  Compass,
  Download,
  ExternalLink,
  MapPin,
  User,
  AlertTriangle,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  Project,
  SiteSurvey,
  DesignFile,
  FollowUpLog,
  LeadActivity,
  DocumentChecklistItem,
  Quotation,
} from '@/types/database';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    projectId: string;
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR' && profile.role !== 'SALES') {
    redirect(getProjectUrlForRole(params.projectId, profile.role));
  }

  const supabase = createClient();

  // Fetch Project details
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select(`
      *,
      lead_owner:profiles!projects_lead_owner_id_fkey(name, role, phone),
      survey_assigned_engineer:profiles!projects_survey_assigned_engineer_id_fkey(name, phone)
    `)
    .eq('id', params.projectId)
    .single();

  if (projectError || !projectData) {
    notFound();
  }

  const project = projectData as unknown as Project & {
    lead_owner?: { name: string; role: string; phone: string | null } | null;
    survey_assigned_engineer?: { name: string; phone: string | null } | null;
  };

  // Fetch Site Survey
  const { data: surveyData } = await supabase
    .from('site_surveys')
    .select(`
      *,
      surveyed_by:profiles!site_surveys_surveyed_by_id_fkey(name)
    `)
    .eq('project_id', project.id)
    .maybeSingle();

  const siteSurvey = surveyData as (SiteSurvey & { surveyed_by?: { name: string } | null }) | null;

  // Fetch all Design Files for the project
  const { data: designFilesData } = await supabase
    .from('design_files')
    .select(`
      *,
      uploaded_by:profiles!design_files_uploaded_by_id_fkey(name)
    `)
    .eq('project_id', project.id)
    .order('uploaded_at', { ascending: false });

  const designFiles = (designFilesData as (DesignFile & { uploaded_by?: { name: string } | null })[]) || [];
  const latestDesign = designFiles[0] || null;

  // Fetch Team Profiles for @mentions and author mapping
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  const teamProfiles = (profilesData as any[]) || [];
  const profilesMap = new Map<string, any>(teamProfiles.map((p) => [p.id, p]));

  // Fetch Quotation Versions
  const { data: quotesData } = await supabase
    .from('quotations')
    .select('*')
    .eq('project_id', project.id)
    .order('version', { ascending: false });

  const quotations = (quotesData as Quotation[]) || [];

  // Fetch Document Checklist Items
  const { data: docsData } = await supabase
    .from('document_checklist_items')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: true });

  const checklistItems = (docsData as DocumentChecklistItem[]) || [];

  // Fetch Lead Activities
  const { data: activitiesData } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  const leadActivities = ((activitiesData as any[]) || []).map((a) => ({
    ...a,
    created_by: profilesMap.get(a.created_by_id) ? { name: profilesMap.get(a.created_by_id).name } : null,
  })) as LeadActivity[];

  // Fetch Follow Up Logs
  const { data: followUpsData } = await supabase
    .from('follow_up_logs')
    .select('*')
    .eq('project_id', project.id)
    .order('reminder_sent_at', { ascending: false });

  const followUpLogs = (followUpsData as FollowUpLog[]) || [];

  // Fetch Project Comments
  const { data: commentsData } = await supabase
    .from('project_comments')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: true });

  const comments = ((commentsData as any[]) || []).map((c) => ({
    ...c,
    author: profilesMap.get(c.author_id)
      ? { name: profilesMap.get(c.author_id).name, role: profilesMap.get(c.author_id).role }
      : null,
  }));

  // Fetch Reassignments
  const { data: reassignmentsData } = await supabase
    .from('reassignment_logs')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  const reassignments = ((reassignmentsData as any[]) || []).map((r) => ({
    ...r,
    reassigned_from: profilesMap.get(r.reassigned_from_id) ? { name: profilesMap.get(r.reassigned_from_id).name } : null,
    reassigned_to: profilesMap.get(r.reassigned_to_id) ? { name: profilesMap.get(r.reassigned_to_id).name } : null,
    reassigned_by: profilesMap.get(r.reassigned_by_id) ? { name: profilesMap.get(r.reassigned_by_id).name } : null,
  }));

  const isDirector = profile.role === 'DIRECTOR';
  const isLeadOwner = project.lead_owner_id === user.id;
  const canEditLead = isDirector || isLeadOwner;
  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/pipeline"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#5f6570] hover:text-[#181d26]"
            >
              <ArrowLeft className="h-4 w-4" />
              Pipeline
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#181d26]">{project.client_name}</h1>
                <span className="rounded-full bg-[#f0f2f5] px-2.5 py-0.5 text-xs font-bold text-[#181d26] border border-[#e0e2e6]">
                  {project.stage}
                </span>
                {project.stage === 'STALE' && (
                  <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    STALE
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5f6570] mt-0.5">
                Lead Owner: {project.lead_owner?.name || 'Unassigned'} • Created on{' '}
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/pipeline/${project.id}/site-survey`}
              className="flex items-center gap-1.5 rounded-lg border border-[#e0e2e6] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#333840] shadow-2xs hover:bg-[#fafbfc]"
            >
              <Camera className="h-4 w-4 text-[#aa2d00]" />
              {siteSurvey ? 'View Survey Assessment' : 'Survey Status & Details'}
            </Link>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Metadata & Design & Survey (2 Cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Project Metadata Card */}
            <LeadMetadataEditor
              project={project}
              canEdit={canEditLead}
              canScheduleSurvey={isLeadOwner || isDirector}
              availableEngineers={teamProfiles.filter(
                (p) => p.role === 'SITE_EXECUTION' || p.role === 'DIRECTOR'
              )}
            />

            {/* Document Checklist Card */}
            <DocumentChecklistSection
              projectId={project.id}
              checklistItems={checklistItems}
              category={project.category}
            />

            {/* Site Survey Card */}
            <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-[#aa2d00]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#181d26]">Site Survey Assessment</h3>
                </div>
                {siteSurvey ? (
                  <span className="rounded-full bg-[#e8f5e9] px-2.5 py-0.5 text-xs font-semibold text-[#15803d] border border-[#a8d8c4]">
                    Completed
                  </span>
                ) : (
                  <span className="rounded-full bg-[#f0f2f5] px-2.5 py-0.5 text-xs font-medium text-[#41454d]">
                    Pending Survey
                  </span>
                )}
              </div>

              {siteSurvey ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <span className="text-[11px] font-medium text-[#9297a0] block">Proposed Panels</span>
                      <span className="text-sm font-bold text-[#181d26]">{siteSurvey.no_of_panels} Panels</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-[#9297a0] block">On-Site Contact</span>
                      <span className="font-semibold text-[#181d26]">{siteSurvey.contacted_person}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-[#9297a0] block">GPS Coordinates</span>
                      <span className="font-semibold text-[#181d26] flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#aa2d00] shrink-0" />
                        {siteSurvey.gps_location}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-[#9297a0] block">Physical Measurements & Structure</span>
                    <p className="mt-1 rounded-lg bg-[#fafbfc] p-3 text-[#333840] border border-[#f0f2f5] whitespace-pre-wrap">
                      {siteSurvey.physical_measurement}
                    </p>
                  </div>

                  {/* Photo Gallery */}
                  {siteSurvey.photo_urls && siteSurvey.photo_urls.length > 0 && (
                    <div>
                      <span className="text-[11px] font-medium text-[#9297a0] block mb-2">
                        Site Survey Photos ({siteSurvey.photo_urls.length})
                      </span>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {siteSurvey.photo_urls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-lg border border-[#e0e2e6] bg-[#f0f2f5]"
                          >
                            <img
                              src={url}
                              alt={`Survey Photo ${idx + 1}`}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                              <ExternalLink className="h-4 w-4 text-white" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Diagrams Gallery */}
                  {siteSurvey.diagram_urls && siteSurvey.diagram_urls.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-medium text-[#9297a0] block mb-2">
                        Layout Sketches & Diagrams ({siteSurvey.diagram_urls.length})
                      </span>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {siteSurvey.diagram_urls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-lg border border-[#e0e2e6] bg-[#f0f2f5]"
                          >
                            <img
                              src={url}
                              alt={`Survey Diagram ${idx + 1}`}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                              <ExternalLink className="h-4 w-4 text-white" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-[#f0f2f5] pt-2 text-[10px] text-[#9297a0]">
                    Surveyed by {siteSurvey.surveyed_by?.name || 'Engineer'} on{' '}
                    {new Date(siteSurvey.surveyed_at).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-[#5f6570] space-y-3">
                  {project.survey_scheduled_date ? (
                    <div className="rounded-lg bg-[#fff0eb]/60 p-3 text-[#882400] border border-[#f5e9d4] max-w-md mx-auto text-left">
                      <p className="font-semibold flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#aa2d00]" />
                        Survey Scheduled for {new Date(project.survey_scheduled_date).toLocaleDateString()}
                      </p>
                      <p className="text-[11px] text-[#aa2d00] mt-0.5">
                        Assigned Engineer:{' '}
                        <strong>{project.survey_assigned_engineer?.name || 'Site Execution Team'}</strong>
                      </p>
                    </div>
                  ) : (
                    <p>No site survey submitted yet.</p>
                  )}

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Link
                      href={`/pipeline/${project.id}/site-survey`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e0e2e6] bg-white px-3 py-1.5 text-xs font-semibold text-[#333840] hover:bg-[#fafbfc]"
                    >
                      <Clock className="h-3.5 w-3.5 text-[#aa2d00]" />
                      View Survey Status (Sales Coordination)
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Design Files Card */}
            <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-cyan-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#181d26]">Engineering Layout & Design</h3>
                </div>
                {designFiles.length > 0 ? (
                  <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-700 border border-cyan-200">
                    {designFiles.length} Drawing(s) Published
                  </span>
                ) : (
                  <span className="rounded-full bg-[#f0f2f5] px-2.5 py-0.5 text-xs font-medium text-[#41454d]">
                    Awaiting Design
                  </span>
                )}
              </div>

              {designFiles.length > 0 ? (
                <div className="space-y-2">
                  {designFiles.map((df) => (
                    <div
                      key={df.id}
                      className="flex items-center justify-between rounded-lg bg-[#fafbfc] p-3 border border-[#f0f2f5] text-xs hover:border-[#d0d4dc] transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#181d26]">{df.type} Drawing (v{df.version})</span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                              df.status === 'NEEDS_REVISION'
                                ? 'bg-[#fff0eb] text-[#aa2d00] border border-[#fcab79]'
                                : 'bg-[#e8f5e9] text-[#0a2e0e]'
                            }`}
                          >
                            {df.status || 'APPROVED'}
                          </span>
                        </div>
                        {df.version_notes && (
                          <p className="text-[11px] text-[#41454d] italic">&quot;{df.version_notes}&quot;</p>
                        )}
                        <p className="text-[10px] text-[#9297a0]">
                          Uploaded by {df.uploaded_by?.name || 'Designer'} on{' '}
                          {new Date(df.uploaded_at).toLocaleString()}
                        </p>
                      </div>
                      <a
                        href={df.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-cyan-700 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download CAD / PDF
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#5f6570]">
                  {project.stage === 'SITE_SURVEY_DONE'
                    ? 'Project is in the Design Team queue. The engineering drawing will appear here once uploaded.'
                    : 'Initial engineering drawing will be queued after Site Survey completion.'}
                </p>
              )}
            </div>

            {/* Activity Timeline Stream */}
            <LeadActivityTimeline
              projectId={project.id}
              activities={leadActivities}
              currentUserId={user.id}
            />
          </div>

          {/* Right Column: Quotations, Payment, Follow-ups */}
          <div className="space-y-6">
            {/* Quotation & Proposal Section */}
            <QuotationSection
              project={project}
              quotations={quotations}
              canEdit={canEditLead}
            />

            {/* Follow-up Reminder Section */}
            <FollowUpSection
              logs={followUpLogs}
              projectId={project.id}
              canEdit={canEditLead}
            />
          </div>
        </div>

        {/* Cross-Module Discussions & Consolidated Activity Feed */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ProjectCommentsSection
            projectId={project.id}
            comments={comments}
            teamMembers={teamProfiles}
            currentUserId={user.id}
            canEdit={canEditLead}
          />
          <ConsolidatedActivityTimeline
            comments={comments}
            activities={leadActivities}
            reassignments={reassignments}
            designFiles={designFiles}
          />
        </div>
      </div>
    </AppShell>
  );
}
