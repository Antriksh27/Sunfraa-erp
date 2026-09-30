'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { UserRole } from '@/types/database';

export async function createUserAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized. Please log in.' };
  }

  // Ensure current user is DIRECTOR
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (currentProfile?.role !== 'DIRECTOR') {
    return { error: 'Forbidden: Only Directors can manage users.' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const role = formData.get('role') as UserRole;
  const temporaryPassword = formData.get('password') as string;

  if (!name || !email || !role || !temporaryPassword) {
    return { error: 'Name, email, temporary password, and role are required.' };
  }

  const adminClient = createAdminClient();

  // 1. Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { name, phone },
  });

  if (authError || !authData.user) {
    return { error: authError?.message || 'Failed to create auth user.' };
  }

  // 2. Insert matching profile
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: authData.user.id,
    name,
    phone: phone || null,
    role,
    active: true,
  });

  if (profileError) {
    // Cleanup created auth user if profile insertion failed
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export async function updateUserAction(userId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (currentProfile?.role !== 'DIRECTOR') {
    return { error: 'Forbidden: Only Directors can edit users.' };
  }

  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const role = formData.get('role') as UserRole;
  const active = formData.get('active') === 'true';

  if (!name || !role) {
    return { error: 'Name and role are required.' };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('profiles')
    .update({
      name,
      phone: phone || null,
      role,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  redirect('/admin/users');
}
