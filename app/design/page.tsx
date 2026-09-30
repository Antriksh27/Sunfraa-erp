import { getCurrentUserAndProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import DesignQueuesView from './DesignQueuesView';

import PageHeader from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function DesignPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR' && profile.role !== 'DESIGN') {
    redirect('/');
  }

  const supabase = createClient();

  // 1. Initial Design Queue: projects where stage is SITE_SURVEY_DONE or DESIGN_PENDING
  const { data: initialProjects } = await supabase
    .from('projects')
    .select(`
      *,
      site_survey:site_surveys(*)
    `)
    .in('stage', ['SITE_SURVEY_DONE', 'DESIGN_PENDING'])
    .order('updated_at', { ascending: false });

  // Filter out any projects that already have an INITIAL design file
  const { data: existingInitialFiles } = await supabase
    .from('design_files')
    .select('project_id')
    .eq('type', 'INITIAL');

  const initialUploadedSet = new Set(existingInitialFiles?.map((f) => f.project_id) || []);
  const initialDesignQueue = (initialProjects || []).filter((p) => !initialUploadedSet.has(p.id));

  // 2. Revisions Required Queue: projects with any design_files flagged as NEEDS_REVISION
  const { data: revisionFiles } = await supabase
    .from('design_files')
    .select(`
      *,
      project:projects(
        *,
        site_survey:site_surveys(*)
      )
    `)
    .eq('status', 'NEEDS_REVISION');

  const revisionMap = new Map<string, any>();
  revisionFiles?.forEach((rf) => {
    if (rf.project && !revisionMap.has(rf.project.id)) {
      revisionMap.set(rf.project.id, {
        ...rf.project,
        design_files: [rf],
      });
    }
  });
  const revisionQueue = Array.from(revisionMap.values());

  // 3. CEI Drawing Queue (Business Rule 11): projects where cei_required = true, stage in post-execution
  const { data: ceiProjects } = await supabase
    .from('projects')
    .select(`
      *,
      site_survey:site_surveys(*)
    `)
    .eq('cei_required', true)
    .in('stage', ['CEI_IN_PROGRESS', 'LIAISONING_IN_PROGRESS'])
    .order('updated_at', { ascending: false });

  // Filter out any that already have CEI drawings uploaded
  const { data: existingCEIFiles } = await supabase
    .from('design_files')
    .select('project_id')
    .eq('type', 'CEI_DRAWING');

  const ceiUploadedSet = new Set(existingCEIFiles?.map((f) => f.project_id) || []);
  const ceiDrawingQueue = (ceiProjects || []).filter((p) => !ceiUploadedSet.has(p.id));

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="space-y-6">
        <PageHeader
          moduleNumber={5}
          moduleName="Design & Engineering Studio"
          title="CAD Layouts & Electrical Single Line Diagrams"
          description="Work queues for early-stage CAD layouts, SLD specifications, design revision requests, and CEI statutory single-line schematics."
          badgeColor="bg-cyan-600"
        />

        <DesignQueuesView
          initialDesignQueue={initialDesignQueue as any[]}
          ceiDrawingQueue={ceiDrawingQueue as any[]}
          revisionQueue={revisionQueue as any[]}
        />
      </div>
    </AppShell>
  );
}
