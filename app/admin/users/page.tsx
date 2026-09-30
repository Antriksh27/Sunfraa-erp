import { createClient } from '@/lib/supabase/server';
import { getCurrentUserAndProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Edit2, ShieldAlert, CheckCircle2, XCircle, ArrowLeft, Users, ShieldCheck } from 'lucide-react';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import { Profile } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (profile.role !== 'DIRECTOR') {
    redirect('/');
  }

  const supabase = createClient();

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const profilesList = (users as Profile[]) || [];

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      <div className="space-y-6">
        <PageHeader
          moduleName="Administration & Access Control"
          title="Staff Directory & Role Permissions"
          description="Manage solar EPC organization members, departmental role permissions, and active credential access."
          badgeColor="bg-[#181d26]"
          actions={
            <Link
              href="/admin/users/new"
              className="inline-flex items-center gap-2 rounded-lg bg-[#181d26] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#181d26] transition-all border border-[#181d26]"
            >
              <UserPlus className="h-4 w-4 text-[#fcab79]" />
              Create New Staff User
            </Link>
          }
        />

        {/* User Directory Table Card */}
        <div className="card-airtable overflow-hidden">
          <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#41454d]" />
              <h2 className="font-display text-xs font-bold text-[#181d26]">
                Staff Directory ({profilesList.length} Accounts)
              </h2>
            </div>
            <span className="text-[10px] font-mono font-semibold text-[#5f6570]">
              Role-Based Access Control Active
            </span>
          </div>

          {error && (
            <div className="m-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
              <span>Failed to load users: {error.message}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="table-airtable">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Department Role</th>
                  <th>Work Email</th>
                  <th>Phone Number</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {profilesList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[#5f6570]">
                      <Users className="mx-auto h-8 w-8 text-[#d0d4dc] mb-2" />
                      <p className="font-semibold text-[#181d26]">No Staff Profiles Found</p>
                      <p className="text-[11px] text-[#5f6570] mt-1">No user accounts have been created yet. Click "Add Staff Member" above to invite your team.</p>
                    </td>
                  </tr>
                ) : (
                  profilesList.map((p) => (
                    <tr key={p.id}>
                      <td className="font-semibold text-[#181d26]">
                        {p.name}
                      </td>
                      <td>
                        <span className="inline-flex rounded-full border border-[#e0e2e6] bg-[#f0f2f5] px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#181d26]">
                          {p.role}
                        </span>
                      </td>
                      <td className="text-[#41454d] font-mono text-[11px]">
                        {p.email || '—'}
                      </td>
                      <td className="text-[#41454d] font-mono text-[11px]">
                        {p.phone || '—'}
                      </td>
                      <td>
                        {p.active ? (
                          <span className="badge-sla-ok">
                            <CheckCircle2 className="h-3 w-3 text-[#16a34a] inline mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="badge-sla-danger">
                            <XCircle className="h-3 w-3 text-rose-600 inline mr-1" />
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="text-[#5f6570] font-mono text-[11px]">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/admin/users/${p.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#aa2d00] hover:text-[#882400] transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit User
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
