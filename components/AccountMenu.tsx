'use client';

import { useState } from 'react';
import { UserRole } from '@/types/database';
import { signOutAction } from '@/app/auth/actions';
import { LogOut, User as UserIcon } from 'lucide-react';

interface AccountMenuProps {
  name: string;
  role: UserRole;
  email?: string;
}

export default function AccountMenu({ name, role, email }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getRoleBadgeStyle = (r: UserRole) => {
    switch (r) {
      case 'DIRECTOR':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SALES':
        return 'bg-[#f5e9d4] text-[#882400] border-[#fcab79]';
      case 'ACCOUNTS':
        return 'bg-[#d1fae5] text-[#0a2e0e] border-[#a8d8c4]';
      case 'SITE_EXECUTION':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'HEAD_ENGINEER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STORE_PURCHASE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DESIGN':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'LIAISONING':
        return 'bg-[#f5e9d4] text-[#882400] border-[#fcab79]';
      default:
        return 'bg-[#f0f2f5] text-[#181d26] border-[#e0e2e6]';
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-lg border border-[#e0e2e6] bg-white px-3 py-1.5 text-sm font-medium text-[#333840] shadow-sm hover:bg-[#fafbfc] focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f0f2f5] text-[#41454d]">
          <UserIcon className="h-4 w-4" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-[#181d26] leading-tight">{name}</span>
          <span className="text-[10px] text-[#5f6570] uppercase tracking-wider">{role}</span>
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg border border-[#e0e2e6] bg-white p-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="border-b border-[#f0f2f5] px-3 py-2">
              <p className="text-xs font-medium text-[#5f6570]">Signed in as</p>
              <p className="truncate text-sm font-semibold text-[#181d26]">{name}</p>
              {email && <p className="truncate text-xs text-[#5f6570]">{email}</p>}
              <div className="mt-2">
                <span
                  className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${getRoleBadgeStyle(
                    role
                  )}`}
                >
                  {role}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
