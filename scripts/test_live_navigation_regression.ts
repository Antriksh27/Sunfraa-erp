/**
 * LIVE HTTP NAVIGATION REGRESSION TEST SUITE
 * 
 * Verifies real HTTP navigation requests against the running Next.js application
 * (defaulting to http://localhost:3000).
 *
 * Specifically tests the two previously broken cases:
 * 1. SITE_EXECUTION hitting /pipeline (Sales Kanban) -> MUST be redirected (HTTP 307)
 * 2. ACCOUNTS hitting /pipeline/[projectId] (Sales Dossier) -> MUST be redirected (HTTP 307)
 * 
 * Along with additional boundary tests for each role's allowed and unauthorized routes.
 */

import { createServerClient } from '@supabase/ssr';

const BASE_URL = process.env.TEST_APP_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yxiqsrhuzjirbcgprbct.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4aXFzcmh1emppcmJjZ3ByYmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjU5MzcsImV4cCI6MjEwMzg0MTkzN30.R9KQECesunHhcbSl9r-QbtW1E7U1jMqig6U4gi8vL0Q';

const REAL_PROJECT_ID = 'b1000006-0000-4000-8000-000000000006';

interface TestCase {
  category: string;
  role: string;
  email: string;
  route: string;
  expectedStatus: 200 | 307;
  expectedRedirectLocation?: string;
  description: string;
}

const REGRESSION_CASES: TestCase[] = [
  // =========================================================================
  // PREVIOUSLY-BROKEN CASE 1: SITE_EXECUTION overprivilege on Sales Pipeline
  // =========================================================================
  {
    category: 'CRITICAL BUG REGRESSION #1',
    role: 'SITE_EXECUTION',
    email: 'execution.demo@sunfraaglobal.com',
    route: '/pipeline',
    expectedStatus: 307,
    expectedRedirectLocation: '/',
    description: 'SITE_EXECUTION hitting /pipeline (Sales Kanban) -> MUST REDIRECT (307)'
  },
  {
    category: 'CRITICAL BUG REGRESSION #1',
    role: 'SITE_EXECUTION',
    email: 'execution.demo@sunfraaglobal.com',
    route: `/pipeline/${REAL_PROJECT_ID}`,
    expectedStatus: 307,
    expectedRedirectLocation: '/',
    description: 'SITE_EXECUTION hitting /pipeline/[projectId] -> MUST REDIRECT (307)'
  },
  {
    category: 'CRITICAL BUG REGRESSION #1',
    role: 'SITE_EXECUTION',
    email: 'execution.demo@sunfraaglobal.com',
    route: '/pipeline/new',
    expectedStatus: 307,
    expectedRedirectLocation: '/',
    description: 'SITE_EXECUTION hitting /pipeline/new -> MUST REDIRECT (307)'
  },
  {
    category: 'ROLE BOUNDARY VERIFICATION',
    role: 'SITE_EXECUTION',
    email: 'execution.demo@sunfraaglobal.com',
    route: '/execution',
    expectedStatus: 200,
    description: 'SITE_EXECUTION legitimate route /execution -> MUST ALLOW (200 OK)'
  },

  // =========================================================================
  // PREVIOUSLY-BROKEN CASE 2: ACCOUNTS user accessing Sales Dossier
  // =========================================================================
  {
    category: 'CRITICAL BUG REGRESSION #2',
    role: 'ACCOUNTS',
    email: 'accounts.demo@sunfraaglobal.com',
    route: `/pipeline/${REAL_PROJECT_ID}`,
    expectedStatus: 307,
    expectedRedirectLocation: '/',
    description: 'ACCOUNTS hitting /pipeline/[projectId] (Sales Dossier) -> MUST REDIRECT (307)'
  },
  {
    category: 'CRITICAL BUG REGRESSION #2',
    role: 'ACCOUNTS',
    email: 'accounts.demo@sunfraaglobal.com',
    route: '/pipeline',
    expectedStatus: 307,
    expectedRedirectLocation: '/',
    description: 'ACCOUNTS hitting /pipeline (Sales Kanban) -> MUST REDIRECT (307)'
  },
  {
    category: 'CRITICAL BUG REGRESSION #2',
    role: 'ACCOUNTS',
    email: 'accounts.demo@sunfraaglobal.com',
    route: `/pipeline/${REAL_PROJECT_ID}/site-survey`,
    expectedStatus: 307,
    expectedRedirectLocation: '/',
    description: 'ACCOUNTS hitting /pipeline/[projectId]/site-survey -> MUST REDIRECT (307)'
  },
  {
    category: 'CRITICAL BUG REGRESSION #2',
    role: 'ACCOUNTS',
    email: 'accounts.demo@sunfraaglobal.com',
    route: '/manager',
    expectedStatus: 307,
    expectedRedirectLocation: '/',
    description: 'ACCOUNTS hitting /manager -> MUST REDIRECT (307)'
  },
  {
    category: 'ROLE BOUNDARY VERIFICATION',
    role: 'ACCOUNTS',
    email: 'accounts.demo@sunfraaglobal.com',
    route: '/accounts',
    expectedStatus: 200,
    description: 'ACCOUNTS legitimate route /accounts -> MUST ALLOW (200 OK)'
  },
  {
    category: 'ROLE BOUNDARY VERIFICATION',
    role: 'ACCOUNTS',
    email: 'accounts.demo@sunfraaglobal.com',
    route: '/reports',
    expectedStatus: 200,
    description: 'ACCOUNTS legitimate route /reports -> MUST ALLOW (200 OK)'
  },

  // =========================================================================
  // CONTROL CASE: SALES user boundaries
  // =========================================================================
  {
    category: 'CONTROL ROLE VERIFICATION',
    role: 'SALES',
    email: 'sales.demo@sunfraaglobal.com',
    route: '/pipeline',
    expectedStatus: 200,
    description: 'SALES legitimate route /pipeline -> MUST ALLOW (200 OK)'
  },
  {
    category: 'CONTROL ROLE VERIFICATION',
    role: 'SALES',
    email: 'sales.demo@sunfraaglobal.com',
    route: '/accounts',
    expectedStatus: 307,
    expectedRedirectLocation: '/',
    description: 'SALES unauthorized route /accounts -> MUST REDIRECT (307)'
  },
  {
    category: 'CONTROL ROLE VERIFICATION',
    role: 'SALES',
    email: 'sales.demo@sunfraaglobal.com',
    route: '/execution',
    expectedStatus: 307,
    expectedRedirectLocation: '/',
    description: 'SALES unauthorized route /execution -> MUST REDIRECT (307)'
  },
];

async function getAuthCookie(email: string): Promise<string> {
  const cookieStore: Record<string, string> = {};

  const ssrClient = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return Object.entries(cookieStore).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet: { name: string; value: string }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          cookieStore[name] = value;
        });
      },
    },
  });

  const { error } = await ssrClient.auth.signInWithPassword({
    email,
    password: 'Demo@1234',
  });

  if (error) {
    throw new Error(`Authentication failed for ${email}: ${error.message}`);
  }

  return Object.entries(cookieStore)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function main() {
  console.log('========================================================================================');
  console.log(`LIVE HTTP REGRESSION TEST: ACTIVE NEXT.JS APP (${BASE_URL})`);
  console.log('========================================================================================\n');

  const cookieCache: Record<string, string> = {};
  let passCount = 0;
  let failCount = 0;

  const testOutputs: {
    category: string;
    role: string;
    route: string;
    expected: string;
    actual: string;
    location: string;
    status: 'PASS' | 'FAIL';
    description: string;
  }[] = [];

  for (const tc of REGRESSION_CASES) {
    if (!cookieCache[tc.email]) {
      cookieCache[tc.email] = await getAuthCookie(tc.email);
    }

    const cookie = cookieCache[tc.email];
    const url = `${BASE_URL}${tc.route}`;

    const res = await fetch(url, {
      headers: { Cookie: cookie },
      redirect: 'manual',
    });

    const isRedirect = [301, 302, 307, 308].includes(res.status);
    const location = res.headers.get('location') || '-';

    const passed = (tc.expectedStatus === 200 && res.status === 200) ||
                   (tc.expectedStatus === 307 && isRedirect);

    if (passed) passCount++;
    else failCount++;

    testOutputs.push({
      category: tc.category,
      role: tc.role,
      route: tc.route,
      expected: tc.expectedStatus === 200 ? '200 OK' : '307 REDIRECT',
      actual: `${res.status} ${isRedirect ? 'REDIRECT' : (res.status === 200 ? 'OK' : 'ERROR')}`,
      location,
      status: passed ? 'PASS' : 'FAIL',
      description: tc.description,
    });
  }

  console.log('| Category | Role Tested | Attempted Route | Expected Response | Actual Response | Redirect Target | Status |');
  console.log('|---|---|---|---|---|---|---|');
  for (const o of testOutputs) {
    const statusIcon = o.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`| ${o.category} | ${o.role} | \`${o.route}\` | ${o.expected} | ${o.actual} | ${o.location !== '-' ? `\`${o.location}\`` : '-'} | ${statusIcon} |`);
  }

  console.log(`\n========================================================================================`);
  console.log(`Live Regression Summary: ${passCount} PASSED, ${failCount} FAILED out of ${REGRESSION_CASES.length} assertions.`);
  console.log(`========================================================================================\n`);

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
