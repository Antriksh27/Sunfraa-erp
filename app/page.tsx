import { getCurrentUserAndProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';
import { getRoleDashboardData } from '@/lib/attentionSignals';

import SalesHomeDashboard from '@/components/dashboards/SalesHomeDashboard';
import AccountsHomeDashboard from '@/components/dashboards/AccountsHomeDashboard';
import ExecutionHomeDashboard from '@/components/dashboards/ExecutionHomeDashboard';
import StoreHomeDashboard from '@/components/dashboards/StoreHomeDashboard';
import DesignHomeDashboard from '@/components/dashboards/DesignHomeDashboard';
import LiaisoningHomeDashboard from '@/components/dashboards/LiaisoningHomeDashboard';
import DirectorHomeDashboard from '@/components/dashboards/DirectorHomeDashboard';

export const dynamic = 'force-dynamic';

export default async function RootHomePage() {
  const { user, profile } = await getCurrentUserAndProfile();
  const supabase = createClient();

  const dashboardData = await getRoleDashboardData(supabase, profile.role, user.id);

  return (
    <AppShell user={{ name: profile.name, role: profile.role, email: user.email }}>
      {profile.role === 'SALES' && dashboardData.sales && (
        <SalesHomeDashboard data={dashboardData.sales} userName={profile.name} />
      )}

      {profile.role === 'ACCOUNTS' && dashboardData.accounts && (
        <AccountsHomeDashboard data={dashboardData.accounts} userName={profile.name} />
      )}

      {profile.role === 'SITE_EXECUTION' && dashboardData.execution && (
        <ExecutionHomeDashboard data={dashboardData.execution} userName={profile.name} />
      )}

      {profile.role === 'HEAD_ENGINEER' && dashboardData.execution && (
        <ExecutionHomeDashboard data={dashboardData.execution} userName={profile.name} isHeadEngineer={true} />
      )}

      {profile.role === 'STORE_PURCHASE' && dashboardData.store && (
        <StoreHomeDashboard data={dashboardData.store} userName={profile.name} />
      )}

      {profile.role === 'DESIGN' && dashboardData.design && (
        <DesignHomeDashboard data={dashboardData.design} userName={profile.name} />
      )}

      {profile.role === 'LIAISONING' && dashboardData.liaisoning && (
        <LiaisoningHomeDashboard data={dashboardData.liaisoning} userName={profile.name} />
      )}

      {profile.role === 'DIRECTOR' && dashboardData.director && (
        <DirectorHomeDashboard data={dashboardData.director} userName={profile.name} />
      )}
    </AppShell>
  );
}
