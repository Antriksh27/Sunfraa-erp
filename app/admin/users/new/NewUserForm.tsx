'use client';

import { useState } from 'react';
import { createUserAction } from '@/app/admin/actions';
import { ArrowLeft, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { UserRole } from '@/types/database';
import Link from 'next/link';

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

export default function NewUserForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createUserAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#5f6570] hover:text-[#181d26]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Staff Directory
        </Link>
      </div>

      <div className="rounded-xl border border-[#e0e2e6] bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-[#f0f2f5] pb-4">
          <h1 className="text-lg font-bold text-[#181d26]">Create Staff User</h1>
          <p className="text-xs text-[#5f6570] mt-0.5">
            Add a new team member with specific role and system permissions
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
                placeholder="e.g. Rahul Sharma"
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
                placeholder="+91 98765 43210"
                className="mt-1 block w-full rounded-lg border border-[#d0d4dc] px-3 py-2 text-sm text-[#181d26] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#333840]">
                Work Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="rahul@sunfraaglobal.com"
                className="mt-1 block w-full rounded-lg border border-[#d0d4dc] px-3 py-2 text-sm text-[#181d26] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#333840]">
                Temporary Password <span className="text-red-500">*</span>
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
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
                defaultValue="SALES"
                className="mt-1 block w-full rounded-lg border border-[#d0d4dc] px-3 py-2 text-sm text-[#181d26] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#5f6570]">
                Determines sidebar navigation, accessible modules, and Row Level Security permissions.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#f0f2f5] pt-5">
            <Link
              href="/admin/users"
              className="rounded-lg border border-[#d0d4dc] px-4 py-2 text-xs font-semibold text-[#333840] hover:bg-[#fafbfc]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create User Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
