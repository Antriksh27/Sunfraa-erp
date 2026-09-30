import { getCurrentUserAndProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import LeadIntakeForm from './LeadIntakeForm';
import { Profile } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function NewLeadPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR' && profile.role !== 'SALES') {
    redirect('/');
  }

  const supabase = createClient();

  let salesStaff: Profile[] = [];
  if (profile.role === 'DIRECTOR') {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['SALES', 'DIRECTOR'])
      .eq('active', true);
    salesStaff = (data as Profile[]) || [];
  }

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <LeadIntakeForm
        currentUser={profile}
        salesStaff={salesStaff}
        isDirector={profile.role === 'DIRECTOR'}
      />
    </AppShell>
  );
}
