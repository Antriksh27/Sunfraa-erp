import { getCurrentUserAndProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import NewUserForm from './NewUserForm';

export const dynamic = 'force-dynamic';

export default async function NewUserPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR') {
    redirect('/');
  }

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <NewUserForm />
    </AppShell>
  );
}
