import { createClient } from '@supabase/supabase-js';
import { ROLE_NAV_CONFIG, isRouteAllowedForRole } from '../lib/navigation';
import { UserRole } from '../types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yxiqsrhuzjirbcgprbct.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4aXFzcmh1emppcmJjZ3ByYmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjU5MzcsImV4cCI6MjEwMzg0MTkzN30.R9KQECesunHhcbSl9r-QbtW1E7U1jMqig6U4gi8vL0Q';

async function main() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('--- 1. ATTEMPTING LOGIN WITH HEAD_ENGINEER TEST ACCOUNT ---');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'head.engineer@sunfraa.com',
    password: 'sunfraa@1234',
  });

  if (authError || !authData.user) {
    console.error('Login failed:', authError?.message);
    process.exit(1);
  }

  console.log('Auth login successful!');
  console.log('User ID:', authData.user.id);
  console.log('User Email:', authData.user.email);

  console.log('\n--- 2. FETCHING PROFILE FROM DATABASE ---');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    console.error('Failed to fetch profile:', profileError?.message);
    process.exit(1);
  }

  console.log('Profile Name:', profile.name);
  console.log('Profile Role:', profile.role);
  console.log('Profile Active:', profile.active);

  console.log('\n--- 3. RESOLVING SIDEBAR NAVIGATION FOR ROLE ---');
  const role = profile.role as UserRole;
  const roleConfig = ROLE_NAV_CONFIG[role];

  console.log('Default Route:', roleConfig.defaultRoute);
  console.log('Allowed Route Prefixes:', roleConfig.allowedPrefixes);
  console.log('Sidebar Navigation Items:');
  roleConfig.navItems.forEach((item, index) => {
    console.log(`  [${index + 1}] Label: "${item.label}" | Href: "${item.href}" | Icon: ${item.iconName} | Desc: "${item.description}"`);
  });

  console.log('\n--- 4. TESTING ROUTE PERMISSIONS VIA isRouteAllowedForRole ---');
  const testRoutes = [
    '/',
    '/execution-overview',
    '/execution',
    '/pipeline',
    '/accounts',
    '/store',
    '/design',
    '/liaisoning',
    '/director/approvals',
    '/manager',
    '/admin/users',
  ];

  testRoutes.forEach((route) => {
    const allowed = isRouteAllowedForRole(role, route);
    console.log(`  Route: ${route.padEnd(25)} -> ${allowed ? 'ALLOWED (200 OK)' : 'BLOCKED (Redirect)'}`);
  });

  console.log('\n--- 5. TESTING READ ACCESS TO PROJECTS, BOMS, BOM_ITEMS, EXECUTION_STAGE_PROGRESS ---');
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, client_name, stage')
    .limit(3);
  console.log(`  projects query: ${projectsError ? `ERROR: ${projectsError.message}` : `SUCCESS (${projects?.length} rows retrieved)`}`);

  const { data: boms, error: bomsError } = await supabase
    .from('boms')
    .select('id, project_id')
    .limit(3);
  console.log(`  boms query: ${bomsError ? `ERROR: ${bomsError.message}` : `SUCCESS (${boms?.length} rows retrieved)`}`);

  const { data: bomItems, error: bomItemsError } = await supabase
    .from('bom_items')
    .select('id, item_name')
    .limit(3);
  console.log(`  bom_items query: ${bomItemsError ? `ERROR: ${bomItemsError.message}` : `SUCCESS (${bomItems?.length} rows retrieved)`}`);

  const { data: progress, error: progressError } = await supabase
    .from('execution_stage_progress')
    .select('id, stage, completed_at')
    .limit(3);
  console.log(`  execution_stage_progress query: ${progressError ? `ERROR: ${progressError.message}` : `SUCCESS (${progress?.length} rows retrieved)`}`);
}

main().catch(console.error);
