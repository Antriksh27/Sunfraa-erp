'use client';

import { useState } from 'react';
import { updateUserAction } from '@/app/admin/actions';
import { ArrowLeft, Save, AlertCircle, Loader2, UserX, UserCheck } from 'lucide-react';
import { Profile, UserRole } from '@/types/database';

const ROLES: UserRole[] = [
  'DIRECTOR',
  'SALES',
  'ACCOUNTS',
  'SITE_EXECUTION',
  'HEAD_ENGINEER',
  'STORE_PURCHASE',
  'DESIGN',
  'LIAISONING',
];

export default function EditUserForm({ profile }: { profile: Profile }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(profile.active);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('active', isActive ? 'true' : 'false');

    const result = await updateUserAction(profile.id, formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <a
          href="/admin/users"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#5f6570] hover:text-[#181d26]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Staff Directory
        </a>
      </div>

      <div className="rounded-xl border border-[#e0e2e6] bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-[#f0f2f5] pb-4">
          <h1 className="text-lg font-bold text-[#181d26]">Edit User: {profile.name}</h1>
          <p className="text-xs text-[#5f6570] mt-0.5">
            Update role, phone, or toggle account access status
          </p>
        </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#333840]">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={profile.name}
                  className="mt-1 block w-full rounded-lg border border-[#d0d4dc] px-3 py-2 text-sm text-[#181d26] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333840]">
                  Phone Number
                </label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={profile.phone || ''}
                  placeholder="+91 98765 43210"
                  className="mt-1 block w-full rounded-lg border border-[#d0d4dc] px-3 py-2 text-sm text-[#181d26] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#333840]">
                  User Role & Permissions <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  required
                  defaultValue={profile.role}
                  className="mt-1 block w-full rounded-lg border border-[#d0d4dc] px-3 py-2 text-sm text-[#181d26] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#5f6570]">
                  Role updates take effect immediately on next page load or mutation.
                </p>
              </div>

              {/* Account Status Toggle (Business Rule 17: Deactivation, not deletion) */}
              <div className="sm:col-span-2 rounded-lg border border-[#e0e2e6] bg-[#fafbfc] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-[#181d26]">Account Access Status</h4>
                    <p className="text-[11px] text-[#5f6570]">
                      Deactivating an account blocks future logins without deleting project history or audit logs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                      isActive
                        ? 'bg-[#16a34a] text-white hover:bg-[#15803d]'
                        : 'bg-rose-600 text-white hover:bg-rose-700'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        Active (Click to Deactivate)
                      </>
                    ) : (
                      <>
                        <UserX className="h-3.5 w-3.5" />
                        Inactive (Click to Activate)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#f0f2f5] pt-5">
              <a
                href="/admin/users"
                className="rounded-lg border border-[#d0d4dc] px-4 py-2 text-xs font-semibold text-[#333840] hover:bg-[#fafbfc]"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save User Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
