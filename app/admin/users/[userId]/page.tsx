import { createClient } from '@/lib/supabase/server';
import { getCurrentUserAndProfile } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import EditUserForm from './EditUserForm';
import { Profile } from '@/types/database';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    userId: string;
  };
}

export default async function EditUserPage({ params }: Props) {
  const { user, profile: currentProfile } = await getCurrentUserAndProfile();

  if (currentProfile.role !== 'DIRECTOR') {
    redirect('/');
  }

  const supabase = createClient();

  const { data: userProfile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.userId)
    .single();

  if (error || !userProfile) {
    notFound();
  }

  const profile = userProfile as Profile;

  return (
    <AppShell user={{ name: currentProfile.name, role: currentProfile.role, email: user.email }}>
      <EditUserForm profile={profile} />
    </AppShell>
  );
}
