import { getCurrentUserAndProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PipelineView from './PipelineView';

import PageHeader from '@/components/PageHeader';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR' && profile.role !== 'SALES') {
    redirect('/');
  }

  const supabase = createClient();

  // Query projects (RLS also enforces scoping, but we query explicitly)
  let query = supabase
    .from('projects')
    .select(`
      *,
      lead_owner:profiles!projects_lead_owner_id_fkey(name)
    `)
    .order('created_at', { ascending: false });

  if (profile.role === 'SALES') {
    query = query.eq('lead_owner_id', user.id);
  }

  const { data: projects, error } = await query;

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="space-y-6">
        <PageHeader
          moduleNumber={1}
          moduleName="Sales & Pipeline CRM"
          title="Solar Rooftop Deals & Quotation Velocity"
          description="Lead intake qualification, site survey scheduling, proposal dispatch, and stage milestone conversion pipeline."
          badgeColor="bg-amber-500"
          actions={
            <Link
              href="/pipeline/new"
              className="inline-flex items-center gap-2 rounded-lg bg-[#181d26] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#181d26] transition-all border border-[#181d26]"
            >
              <Plus className="h-4 w-4 text-[#fcab79]" />
              Add New Lead
            </Link>
          }
        />

        <PipelineView
          projects={projects || []}
          isDirector={profile.role === 'DIRECTOR'}
        />
      </div>
    </AppShell>
  );
}
