'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserRole } from '@/types/database';

export async function loginAction(formData: FormData) {
  let email = (formData.get('email') as string || '').trim().toLowerCase();
  const rawPassword = (formData.get('password') as string || '').trim();

  if (!email || !rawPassword) {
    return { error: 'Email/Username and password are required.' };
  }

  const roleAliases: Record<string, string> = {
    // Role Quick Shortcuts -> Primary Role Leads
    'director': 'partner@sunfraa.com',
    'director@sunfraa.com': 'partner@sunfraa.com',
    'admin': 'partner@sunfraa.com',
    'admin@sunfraa.com': 'partner@sunfraa.com',
    'superadmin': 'partner@sunfraa.com',
    'superadmin@sunfraa.com': 'partner@sunfraa.com',

    'sales': 'harsh.sunfraa10@gmail.com',
    'sales@sunfraa.com': 'harsh.sunfraa10@gmail.com',

    'accounts': 'komal.sunfraa@gmail.com',
    'accounts@sunfraa.com': 'komal.sunfraa@gmail.com',

    'execution': 'ajay.sunfraa@gmail.com',
    'execution@sunfraa.com': 'ajay.sunfraa@gmail.com',

    'store': 'jknair.sunfraa@gmail.com',
    'store@sunfraa.com': 'jknair.sunfraa@gmail.com',
    'purchase': 'jknair.sunfraa@gmail.com',
    'purchase@sunfraa.com': 'jknair.sunfraa@gmail.com',

    'operation': 'imran.sunfraa@gmail.com',
    'operation@sunfraa.com': 'imran.sunfraa@gmail.com',
    'design': 'imran.sunfraa@gmail.com',
    'design@sunfraa.com': 'imran.sunfraa@gmail.com',

    'liaisoning': 'maulik.sunfraa1628@gmail.com',
    'liaisoning@sunfraa.com': 'maulik.sunfraa1628@gmail.com',

    // Real Staff Aliases & Handles (from SUNFRAA GLOBAL- User list.pdf)
    'eshan': 'partner@sunfraa.com',
    'eshan@sunfraa.com': 'partner@sunfraa.com',
    'eshan.choliya@sunfraa.com': 'partner@sunfraa.com',
    'naman': 'naman.n@sunfraa.com',
    'naman@sunfraa.com': 'naman.n@sunfraa.com',
    'naman.nagarsheth@sunfraa.com': 'naman.n@sunfraa.com',
    'imran': 'imran.sunfraa@gmail.com',
    'imran@sunfraa.com': 'imran.sunfraa@gmail.com',
    'imran.khan@sunfraa.com': 'imran.sunfraa@gmail.com',
    'harsh': 'harsh.sunfraa10@gmail.com',
    'harsh@sunfraa.com': 'harsh.sunfraa10@gmail.com',
    'harsh.soni@sunfraa.com': 'harsh.sunfraa10@gmail.com',
    'maulik': 'maulik.sunfraa1628@gmail.com',
    'maulik@sunfraa.com': 'maulik.sunfraa1628@gmail.com',
    'nilam': 'nilamsunfraa@gmail.com',
    'nilam@sunfraa.com': 'nilamsunfraa@gmail.com',
    'komal': 'komal.sunfraa@gmail.com',
    'komal@sunfraa.com': 'komal.sunfraa@gmail.com',
    'ajay': 'ajay.sunfraa@gmail.com',
    'ajay@sunfraa.com': 'ajay.sunfraa@gmail.com',
    'viral': 'viral97.sunfraa@gmail.com',
    'viral@sunfraa.com': 'viral97.sunfraa@gmail.com',
    'bhairav': 'bhairav.sunfraa@gmail.com',
    'bhairav@sunfraa.com': 'bhairav.sunfraa@gmail.com',
    'karan': 'karan.sunfraa@gmail.com',
    'karan@sunfraa.com': 'karan.sunfraa@gmail.com',
    'sunil': 'sunil.sunfraa@gmail.com',
    'sunil@sunfraa.com': 'sunil.sunfraa@gmail.com',
    'jknair': 'jknair.sunfraa@gmail.com',
    'jknair@sunfraa.com': 'jknair.sunfraa@gmail.com',
    'vishal': 'vishurathod75@gmail.com',
    'vishal@sunfraa.com': 'vishurathod75@gmail.com',
  };

  if (roleAliases[email]) {
    email = roleAliases[email];
  } else if (!email.includes('@')) {
    email = `${email}@sunfraa.com`;
  }

  const supabase = createClient();
  // Passwords are case-insensitive: authenticate using lowercase first (matching stored hash)
  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: rawPassword.toLowerCase(),
  });

  // If lowercase fails and the user typed uppercase characters, fallback to raw input
  if (error && rawPassword !== rawPassword.toLowerCase()) {
    const retry = await supabase.auth.signInWithPassword({
      email,
      password: rawPassword,
    });
    if (!retry.error) {
      data = retry.data;
      error = null;
    }
  }

  if (error) {
    return { error: error.message };
  }

  // Check if profile exists and if user is active
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('active, role')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      // First-time bootstrap user with no profile yet
      redirect('/setup-profile');
    }

    if (profile.active === false) {
      await supabase.auth.signOut();
      return { error: 'Your account is deactivated. Please contact your administrator.' };
    }
  }

  redirect('/');
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function setupInitialProfile(formData: FormData) {
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;

  if (!name) {
    return { error: 'Name is required.' };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated.' };
  }

  // Bootstrap the first user as DIRECTOR
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    name,
    phone: phone || null,
    role: 'DIRECTOR' as UserRole,
    active: true,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/');
}
