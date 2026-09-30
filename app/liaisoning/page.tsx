import { getCurrentUserAndProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import LiaisoningQueueView from './LiaisoningQueueView';

export const dynamic = 'force-dynamic';

export default async function LiaisoningPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR' && profile.role !== 'LIAISONING') {
    redirect('/');
  }

  const supabase = createClient();

  // Query projects where stage is PAYMENT_COLLECTED or later (Business Rule 12)
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      liaisoning_record:liaisoning_records(
        *,
        follow_up_logs:discom_follow_up_logs(*)
      )
    `)
    .in('stage', [
      'PAYMENT_COLLECTED',
      'DIRECTOR_APPROVED',
      'EXECUTION_IN_PROGRESS',
      'LIAISONING_IN_PROGRESS',
      'CEI_IN_PROGRESS',
      'CONNECTED',
      'CLOSED'
    ])
    .order('updated_at', { ascending: false });

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="space-y-6">
        <PageHeader
          moduleNumber={6}
          moduleName="DISCOM & CEIG Liaisoning Desk"
          title="Government Registrations & Net Meter Grid Sync"
          description="DISCOM government registrations, statutory utility infrastructure estimates, 7-day follow-ups, and net-meter grid synchronization."
          badgeColor="bg-[#aa2d00]"
        />

        <LiaisoningQueueView projects={(projects as any[]) || []} />
      </div>
    </AppShell>
  );
}
