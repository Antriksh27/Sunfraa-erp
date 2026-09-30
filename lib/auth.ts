import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Profile } from '@/types/database';

export async function getCurrentUserAndProfile(): Promise<{
  user: { id: string; email?: string };
  profile: Profile;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/setup-profile');
  }

  if (profile.active === false) {
    redirect('/login?error=deactivated');
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profile as Profile,
  };
}
