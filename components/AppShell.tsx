'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Kanban,
  CreditCard,
  HardHat,
  CheckSquare,
  Boxes,
  Compass,
  Landmark,
  Users,
  Menu,
  X,
  Layers,
  Sparkles,
  Sun,
  Activity,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import AccountMenu from './AccountMenu';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';
import Breadcrumbs from './Breadcrumbs';
import { UserRole } from '@/types/database';
import { ROLE_NAV_CONFIG } from '@/lib/navigation';

interface AppShellProps {
  user: {
    name: string;
    email?: string;
    role: UserRole;
  };
  children: React.ReactNode;
}

const ICON_MAP = {
  LayoutDashboard,
  Kanban,
  CreditCard,
  HardHat,
  CheckSquare,
  Boxes,
  Compass,
  Landmark,
  Users,
};

const MODULE_ACCENTS: Record<string, { bg: string; text: string; lightBg: string }> = {
  '/': { bg: 'bg-[#181d26]', text: 'text-[#181d26]', lightBg: 'bg-[#f0f2f5]' },
  '/director': { bg: 'bg-[#1b61c9]', text: 'text-[#1b61c9]', lightBg: 'bg-[#fff0eb]' },
  '/pipeline': { bg: 'bg-[#d97706]', text: 'text-[#d97706]', lightBg: 'bg-amber-50' },
  '/design': { bg: 'bg-[#0891b2]', text: 'text-[#0891b2]', lightBg: 'bg-cyan-50' },
  '/liaisoning': { bg: 'bg-[#aa2d00]', text: 'text-[#aa2d00]', lightBg: 'bg-[#fff0eb]' },
  '/execution': { bg: 'bg-[#059669]', text: 'text-[#059669]', lightBg: 'bg-[#e8f5e9]' },
  '/execution-overview': { bg: 'bg-[#0284c7]', text: 'text-[#0284c7]', lightBg: 'bg-sky-50' },
  '/store': { bg: 'bg-[#ea580c]', text: 'text-[#ea580c]', lightBg: 'bg-orange-50' },
  '/accounts': { bg: 'bg-[#047857]', text: 'text-[#047857]', lightBg: 'bg-[#e8f5e9]' },
  '/reports': { bg: 'bg-[#7c3aed]', text: 'text-[#7c3aed]', lightBg: 'bg-purple-50' },
  '/admin': { bg: 'bg-[#334155]', text: 'text-[#334155]', lightBg: 'bg-[#f0f2f5]' },
};

export default function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleConfig = ROLE_NAV_CONFIG[user.role] || { navItems: [] };
  const navItems = roleConfig.navItems;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-[#181d26] font-sans antialiased">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#181d26]/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Airtable-Grade Sidebar */}
      <aside
        className={`fixed inset-y-0 z-50 flex w-68 flex-col border-r border-[#e0e2e6] bg-[#ffffff] transition-all duration-200 ease-in-out lg:static ${
          mobileOpen ? 'left-0' : '-left-80'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-[#e2e8f0] px-4 bg-white">
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="Sunfraa Global"
              className="h-14 w-auto max-w-[175px] object-contain transition-transform group-hover:scale-105"
            />
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-wide rounded bg-[#181d26] text-white shadow-2xs mt-[18px]">
              ERP
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-[#9297a0] hover:bg-[#f0f2f5] hover:text-[#333840] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="mb-2 px-3 text-[10px] font-medium uppercase tracking-widest text-[#9297a0]">
              Operations Modules
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = ICON_MAP[item.iconName] || Kanban;
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`relative group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#fff0eb]/80 text-[#882400] font-semibold border border-[#fcab79]/70 shadow-2xs'
                        : 'text-[#41454d] hover:bg-[#f0f2f5]/70 hover:text-[#181d26] border border-transparent'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#aa2d00]" />
                    )}
                  <div className="flex items-center gap-3">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                          isActive
                            ? 'bg-[#aa2d00] text-white'
                            : 'bg-[#f0f2f5] text-[#5f6570] group-hover:bg-[#e0e2e6]/80 group-hover:text-[#333840]'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className={`text-sm ${isActive ? 'font-medium text-[#882400]' : 'font-normal text-[#41454d]'}`}>
                        {item.label}
                      </span>
                    </div>
                    {isActive ? (
                      <span className="h-2 w-2 rounded-full bg-[#aa2d00]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#9297a0] opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Role & Status */}
        <div className="border-t border-[#e2e8f0] p-3.5 bg-[#fafbfc]/60">
          <div className="flex items-center justify-between rounded-xl border border-[#e0e2e6]/80 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fff0eb] text-[#aa2d00] border border-[#f5e9d4]">
                <ShieldCheck className="h-4 w-4" />
              </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-[#9297a0] truncate">
                    Role
                  </p>
                  <p className="text-xs font-medium text-[#333840] truncate">{user.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#e8f5e9] border border-[#a8d8c4] shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-[10px] font-medium text-[#15803d]">LIVE</span>
              </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header / Toolbar */}
        <header className="flex h-16 items-center justify-between border-b border-[#e0e2e6] bg-white px-6 sm:px-8 shadow-2xs gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-[#5f6570] hover:bg-[#f0f2f5] hover:text-[#181d26] lg:hidden shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Breadcrumbs />
          </div>

          <div className="flex items-center gap-3.5 shrink-0">
            <GlobalSearch userRole={user.role} />
            <NotificationCenter />
            <AccountMenu name={user.name} role={user.role} email={user.email} />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#f8fafc]">{children}</main>
      </div>
    </div>
  );
}

