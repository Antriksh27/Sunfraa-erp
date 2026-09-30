import { UserRole } from '@/types/database';

export interface NavItem {
  label: string;
  href: string;
  iconName: 'LayoutDashboard' | 'Kanban' | 'CreditCard' | 'HardHat' | 'CheckSquare' | 'Boxes' | 'Compass' | 'Landmark' | 'Users';
  description: string;
}

export interface RoleConfig {
  defaultRoute: string;
  allowedPrefixes: string[];
  navItems: NavItem[];
}

export const ALL_NAV_ITEMS: Record<string, NavItem> = {
  home: {
    label: 'Home Dashboard',
    href: '/',
    iconName: 'LayoutDashboard',
    description: 'Personalized attention queue & daily operational summary',
  },
  pipeline: {
    label: 'Sales Pipeline',
    href: '/pipeline',
    iconName: 'Kanban',
    description: 'Lead intake, stage tracking & survey management',
  },
  accounts: {
    label: 'Accounts',
    href: '/accounts',
    iconName: 'CreditCard',
    description: 'Payment status, verification & financial tracking',
  },
  execution: {
    label: 'Project Execution',
    href: '/execution',
    iconName: 'HardHat',
    description: 'Labour assignment, site stages & completion logs',
  },
  approvals: {
    label: 'Director Approvals',
    href: '/director/approvals',
    iconName: 'CheckSquare',
    description: 'Approve projects for site execution handoff',
  },
  store: {
    label: 'Store & Purchase',
    href: '/store',
    iconName: 'Boxes',
    description: 'BOM items, inventory ledger & delivery challans',
  },
  design: {
    label: 'Design Team',
    href: '/design',
    iconName: 'Compass',
    description: 'Initial CAD & CEI drawing upload queues',
  },
  liaisoning: {
    label: 'Liaisoning',
    href: '/liaisoning',
    iconName: 'Landmark',
    description: 'DISCOM file tracking, estimates & meter reports',
  },
  reports: {
    label: 'BI Reports',
    href: '/reports',
    iconName: 'LayoutDashboard',
    description: 'Funnels, aging debt, velocity, margins & inventory',
  },
  manager: {
    label: 'Manager & SLAs',
    href: '/manager',
    iconName: 'Users',
    description: 'Workload heatmaps, stage SLAs & reassignment audit (Director Only)',
  },
  executionOverview: {
    label: 'Execution Overview',
    href: '/execution-overview',
    iconName: 'HardHat',
    description: 'Universal Execution Overview Dashboard across all projects & labour',
  },
  admin: {
    label: 'User Management',
    href: '/admin/users',
    iconName: 'Users',
    description: 'User accounts, role assignment & permissions (Director Only)',
  },
};

export const ROLE_NAV_CONFIG: Record<UserRole, RoleConfig> = {
  DIRECTOR: {
    defaultRoute: '/',
    allowedPrefixes: [
      '/pipeline',
      '/accounts',
      '/execution',
      '/execution-overview',
      '/director',
      '/store',
      '/design',
      '/liaisoning',
      '/manager',
      '/reports',
      '/admin',
    ],
    navItems: [
      ALL_NAV_ITEMS.home,
      ALL_NAV_ITEMS.pipeline,
      ALL_NAV_ITEMS.accounts,
      ALL_NAV_ITEMS.execution,
      ALL_NAV_ITEMS.executionOverview,
      ALL_NAV_ITEMS.approvals,
      ALL_NAV_ITEMS.store,
      ALL_NAV_ITEMS.design,
      ALL_NAV_ITEMS.liaisoning,
      ALL_NAV_ITEMS.manager,
      ALL_NAV_ITEMS.reports,
      ALL_NAV_ITEMS.admin,
    ],
  },
  HEAD_ENGINEER: {
    defaultRoute: '/',
    allowedPrefixes: ['/execution-overview'],
    navItems: [ALL_NAV_ITEMS.home, ALL_NAV_ITEMS.executionOverview],
  },
  SALES: {
    defaultRoute: '/',
    allowedPrefixes: ['/pipeline', '/reports'],
    navItems: [ALL_NAV_ITEMS.home, ALL_NAV_ITEMS.pipeline, ALL_NAV_ITEMS.reports],
  },
  ACCOUNTS: {
    defaultRoute: '/',
    allowedPrefixes: ['/accounts', '/reports'],
    navItems: [ALL_NAV_ITEMS.home, ALL_NAV_ITEMS.accounts, ALL_NAV_ITEMS.reports],
  },
  SITE_EXECUTION: {
    defaultRoute: '/',
    allowedPrefixes: ['/execution'],
    navItems: [ALL_NAV_ITEMS.home, ALL_NAV_ITEMS.execution],
  },
  STORE_PURCHASE: {
    defaultRoute: '/',
    allowedPrefixes: ['/store'],
    navItems: [ALL_NAV_ITEMS.home, ALL_NAV_ITEMS.store],
  },
  DESIGN: {
    defaultRoute: '/',
    allowedPrefixes: ['/design'],
    navItems: [ALL_NAV_ITEMS.home, ALL_NAV_ITEMS.design],
  },
  LIAISONING: {
    defaultRoute: '/',
    allowedPrefixes: ['/liaisoning'],
    navItems: [ALL_NAV_ITEMS.home, ALL_NAV_ITEMS.liaisoning],
  },
};

/**
 * Returns the canonical URL for a project based on the user's role.
 */
export function getProjectUrlForRole(projectId: string, role?: UserRole | string | null): string {
  if (!projectId) return '/';

  switch (role) {
    case 'SALES':
    case 'DIRECTOR':
      return `/pipeline/${projectId}`;
    case 'SITE_EXECUTION':
      return `/execution/${projectId}`;
    case 'HEAD_ENGINEER':
      return `/execution-overview`;
    case 'DESIGN':
      return `/design/${projectId}`;
    case 'LIAISONING':
      return `/liaisoning/${projectId}`;
    case 'ACCOUNTS':
      return `/accounts?highlight=${projectId}`;
    case 'STORE_PURCHASE':
      return `/store?highlight=${projectId}`;
    default:
      return `/`;
  }
}

/**
 * Canonical Role -> Route access evaluator.
 * Evaluates both static paths and dynamic segments strictly against canonical permissions.
 */
export function isRouteAllowedForRole(role: UserRole, pathname: string): boolean {
  // Normalize pathname (strip query string and trailing slash)
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/';

  // Common public / authenticated setup routes
  if (path === '/' || path === '/setup-profile') return true;

  // DIRECTOR has access to every route, no exceptions
  if (role === 'DIRECTOR') return true;

  // DIRECTOR-ONLY routes: strictly disallowed for all other roles
  if (
    path === '/director' ||
    path.startsWith('/director/') ||
    path === '/manager' ||
    path.startsWith('/manager/') ||
    path === '/admin' ||
    path.startsWith('/admin/')
  ) {
    return false;
  }

  // Regex helpers for dynamic segment matching
  const isSiteSurveyRoute = /^\/pipeline\/[^\/]+\/site-survey$/.test(path);
  const isPipelineRoute = path === '/pipeline' || path === '/pipeline/new' || /^\/pipeline\/[^\/]+$/.test(path) || isSiteSurveyRoute;
  const isExecutionRoute = path === '/execution' || /^\/execution\/[^\/]+(\/.*)?$/.test(path);
  const isExecutionOverviewRoute = path === '/execution-overview' || /^\/execution-overview(\/.*)?$/.test(path);
  const isDesignRoute = path === '/design' || /^\/design\/[^\/]+(\/.*)?$/.test(path);
  const isLiaisoningRoute = path === '/liaisoning' || /^\/liaisoning\/[^\/]+(\/.*)?$/.test(path);
  const isAccountsRoute = path === '/accounts' || /^\/accounts(\/.*)?$/.test(path);
  const isStoreRoute = path === '/store' || /^\/store(\/.*)?$/.test(path);
  const isReportsRoute = path === '/reports' || /^\/reports(\/.*)?$/.test(path);

  switch (role) {
    case 'HEAD_ENGINEER':
      // HEAD_ENGINEER: /, /execution-overview
      return isExecutionOverviewRoute;

    case 'SALES':
      // SALES: /, /pipeline, /pipeline/new, /pipeline/[projectId], /pipeline/[projectId]/site-survey, /reports
      return isPipelineRoute || isReportsRoute;

    case 'ACCOUNTS':
      // ACCOUNTS: /, /accounts, /reports
      return isAccountsRoute || isReportsRoute;

    case 'SITE_EXECUTION':
      // SITE_EXECUTION: /, /execution, /execution/[projectId], /pipeline/[projectId]/site-survey
      // NOTE: Sales Kanban (/pipeline), new lead intake (/pipeline/new), and sales dossier (/pipeline/[projectId]) are STRICTLY forbidden!
      return isExecutionRoute || isSiteSurveyRoute;

    case 'STORE_PURCHASE':
      // STORE_PURCHASE: /, /store
      return isStoreRoute;

    case 'DESIGN':
      // DESIGN: /, /design, /design/[projectId]
      return isDesignRoute;

    case 'LIAISONING':
      // LIAISONING: /, /liaisoning, /liaisoning/[projectId]
      return isLiaisoningRoute;

    default:
      return false;
  }
}
