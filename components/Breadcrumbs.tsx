'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  pipeline: 'Sales Pipeline',
  accounts: 'Accounts',
  execution: 'Project Execution',
  director: 'Director Approvals',
  approvals: 'Approvals Queue',
  store: 'Store & Purchase',
  design: 'Design Team',
  liaisoning: 'Liaisoning',
  manager: 'Manager & SLAs',
  reports: 'BI Reports',
  admin: 'User Management',
  users: 'Staff Directory',
  new: 'New Intake',
  'site-survey': 'Site Survey',
};

// Check if a segment looks like a UUID or dynamic ID
function isDynamicId(segment: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(segment) || (segment.length > 20 && !segment.includes('-'));
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === '/') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[#181d26] font-bold">
        <Home className="h-3.5 w-3.5 text-[#5f6570]" />
        <span>Home Dashboard</span>
      </div>
    );
  }

  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments.map((seg, idx) => {
    let href = '/' + segments.slice(0, idx + 1).join('/');
    if (href === '/director') href = '/director/approvals';
    if (href === '/admin') href = '/admin/users';
    const isLast = idx === segments.length - 1;

    let label = ROUTE_LABELS[seg.toLowerCase()];
    if (!label) {
      if (isDynamicId(seg)) {
        label = 'Project Details';
      } else {
        label = seg
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }

    return { label, href, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs">
      <Link
        href="/"
        className="flex items-center text-[#5f6570] hover:text-[#181d26] transition-colors"
        title="Home Dashboard"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {crumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-[#9297a0] shrink-0" />
          {crumb.isLast ? (
            <span className="font-bold text-[#181d26] truncate max-w-[200px] sm:max-w-[300px]">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-[#5f6570] hover:text-[#181d26] transition-colors truncate max-w-[150px]"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
