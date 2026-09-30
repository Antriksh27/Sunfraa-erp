import { isRouteAllowedForRole, getProjectUrlForRole } from '../lib/navigation';

type UserRole = 'DIRECTOR' | 'SALES' | 'ACCOUNTS' | 'SITE_EXECUTION' | 'STORE_PURCHASE' | 'DESIGN' | 'LIAISONING';

const ROLES: UserRole[] = [
  'DIRECTOR',
  'SALES',
  'ACCOUNTS',
  'SITE_EXECUTION',
  'STORE_PURCHASE',
  'DESIGN',
  'LIAISONING'
];

const TEST_PROJECT_ID = 'proj-audit-test-999';

const ROUTES_TO_TEST = [
  '/',
  '/pipeline',
  '/pipeline/new',
  `/pipeline/${TEST_PROJECT_ID}`,
  `/pipeline/${TEST_PROJECT_ID}/site-survey`,
  '/accounts',
  '/execution',
  `/execution/${TEST_PROJECT_ID}`,
  '/store',
  '/design',
  `/design/${TEST_PROJECT_ID}`,
  '/liaisoning',
  `/liaisoning/${TEST_PROJECT_ID}`,
  '/reports',
  '/director/approvals',
  '/manager',
  '/admin/users',
  `/admin/users/${TEST_PROJECT_ID}`
];

// Define Canonical Truth
const CANONICAL_ALLOW_MAP: Record<UserRole, (route: string) => boolean> = {
  DIRECTOR: () => true,
  SALES: (r) => ['/', '/pipeline', '/pipeline/new', `/pipeline/${TEST_PROJECT_ID}`, `/pipeline/${TEST_PROJECT_ID}/site-survey`, '/reports'].includes(r),
  ACCOUNTS: (r) => ['/', '/accounts', '/reports'].includes(r),
  SITE_EXECUTION: (r) => ['/', '/execution', `/execution/${TEST_PROJECT_ID}`, `/pipeline/${TEST_PROJECT_ID}/site-survey`].includes(r),
  STORE_PURCHASE: (r) => ['/', '/store'].includes(r),
  DESIGN: (r) => ['/', '/design', `/design/${TEST_PROJECT_ID}`].includes(r),
  LIAISONING: (r) => ['/', '/liaisoning', `/liaisoning/${TEST_PROJECT_ID}`].includes(r),
};

interface TestResult {
  role: UserRole;
  route: string;
  expected: 'ALLOW' | 'DENY';
  actual: 'ALLOW' | 'DENY';
  status: 'PASS' | 'FAIL';
}

console.log('========================================================================================');
console.log('STEP 3: ROUTE-LEVEL ROLE IMPERSONATION & PERMISSION MATRIX TEST');
console.log('========================================================================================\n');

let passCount = 0;
let failCount = 0;
const results: TestResult[] = [];

for (const role of ROLES) {
  for (const route of ROUTES_TO_TEST) {
    const isExpectedAllowed = CANONICAL_ALLOW_MAP[role](route);
    const expected = isExpectedAllowed ? 'ALLOW' : 'DENY';
    const isActualAllowed = isRouteAllowedForRole(role, route);
    const actual = isActualAllowed ? 'ALLOW' : 'DENY';
    const status = expected === actual ? 'PASS' : 'FAIL';

    if (status === 'PASS') {
      passCount++;
    } else {
      failCount++;
    }

    results.push({
      role,
      route,
      expected,
      actual,
      status
    });
  }
}

// Print Markdown Table
console.log('| Role Tested | Route Attempted | Expected Result | Actual Result | Status |');
console.log('|---|---|---|---|---|');
for (const res of results) {
  console.log(`| ${res.role} | \`${res.route}\` | ${res.expected} | ${res.actual} | ${res.status === 'PASS' ? '✅ PASS' : '❌ FAIL'} |`);
}

console.log(`\nRoute Permission Test Summary: ${passCount} PASSED, ${failCount} FAILED out of ${results.length} test assertions.\n`);

console.log('========================================================================================');
console.log('CROSS-LINK HELPER (getProjectUrlForRole) TEST');
console.log('========================================================================================\n');

const EXPECTED_PROJECT_URLS: Record<UserRole, string> = {
  DIRECTOR: `/pipeline/${TEST_PROJECT_ID}`,
  SALES: `/pipeline/${TEST_PROJECT_ID}`,
  SITE_EXECUTION: `/execution/${TEST_PROJECT_ID}`,
  DESIGN: `/design/${TEST_PROJECT_ID}`,
  LIAISONING: `/liaisoning/${TEST_PROJECT_ID}`,
  ACCOUNTS: `/accounts?highlight=${TEST_PROJECT_ID}`,
  STORE_PURCHASE: `/store?highlight=${TEST_PROJECT_ID}`,
};

let helperPass = 0;
let helperFail = 0;

for (const role of ROLES) {
  const actualUrl = getProjectUrlForRole(TEST_PROJECT_ID, role);
  const expectedUrl = EXPECTED_PROJECT_URLS[role];
  const pass = actualUrl === expectedUrl;
  if (pass) {
    helperPass++;
    console.log(`✅ [${role}] -> Expected: ${expectedUrl} | Actual: ${actualUrl}`);
  } else {
    helperFail++;
    console.log(`❌ [${role}] -> Expected: ${expectedUrl} | Actual: ${actualUrl}`);
  }
}

console.log(`\nHelper Test Summary: ${helperPass} PASSED, ${helperFail} FAILED out of ${ROLES.length}.\n`);

if (failCount > 0 || helperFail > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
