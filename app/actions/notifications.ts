'use server';

import { createClient } from '@/lib/supabase/server';
import { getRoleDashboardData, AttentionItem } from '@/lib/attentionSignals';
import { UserRole } from '@/types/database';

export interface NotificationItem {
  key: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  href: string;
  timestamp?: string;
  isRead: boolean;
}

export async function getNotificationsAction(): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { notifications: [], unreadCount: 0, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return { notifications: [], unreadCount: 0 };
    }

    // 1. Fetch attention signals using the shared query layer
    const dashboardData = await getRoleDashboardData(supabase, profile.role as UserRole, user.id);

    // 2. Aggregate all attention items for the role
    const rawItems: (AttentionItem & { categoryKey: string })[] = [];

    if (dashboardData.sales) {
      dashboardData.sales.leadsNeedingFollowUp.forEach((i) =>
        rawItems.push({ ...i, categoryKey: `sales_lead_${i.id}` })
      );
      dashboardData.sales.leadsAboutToGoStale.forEach((i) =>
        rawItems.push({ ...i, categoryKey: `sales_stale_${i.id}` })
      );
      dashboardData.sales.todaysScheduledSurveys.forEach((i) =>
        rawItems.push({ ...i, categoryKey: `sales_survey_${i.id}` })
      );
    }

    if (dashboardData.accounts) {
      dashboardData.accounts.paymentsOverdue.forEach((i) =>
        rawItems.push({ ...i, categoryKey: `accounts_overdue_${i.id}` })
      );
      dashboardData.accounts.noPaymentActivity15Days.forEach((i) =>
        rawItems.push({ ...i, categoryKey: `accounts_dormant_${i.id}` })
      );
    }

    if (dashboardData.execution) {
      dashboardData.execution.todaysLabourAssignments.forEach((i) =>
        rawItems.push({ ...i, categoryKey: `exec_labour_${i.id}` })
      );
      dashboardData.execution.idleIncompleteStages.forEach((i) =>
        rawItems.push({ ...i, categoryKey: `exec_stage_${i.id}` })
      );
    }

    if (dashboardData.store) {
      dashboardData.store.lowBOMQueue.forEach((i) =>
        rawItems.push({ ...i, categoryKey: `store_bom_${i.id}` })
      );
      dashboardData.store.pendingStockOutAwaitingChallan.forEach((i) =>
        rawItems.push({ ...i, categoryKey: `store_challan_${i.id}` })
      );
    }

    if (dashboardData.design) {
      dashboardData.design.initialDesignQueue.forEach((i) =>
        rawItems.push({ ...i, categoryKey: `design_initial_${i.id}` })
      );
      dashboardData.design.ceiDrawingQueue.forEach((i) =>
        rawItems.push({ ...i, categoryKey: `design_cei_${i.id}` })
      );
    }

    if (dashboardData.liaisoning) {
      dashboardData.liaisoning.discomFollowUpsDue.forEach((i) =>
        rawItems.push({ ...i, categoryKey: `liaison_followup_${i.id}` })
      );
      dashboardData.liaisoning.stagnantApplications.forEach((i) =>
        rawItems.push({ ...i, categoryKey: `liaison_estimate_${i.id}` })
      );
    }

    if (dashboardData.director) {
      dashboardData.director.pendingApprovals.forEach((i) =>
        rawItems.push({ ...i, categoryKey: `director_approval_${i.id}` })
      );
    }

    // 3. Query read state from notification_reads
    const itemKeys = rawItems.map((i) => i.categoryKey);
    let readKeySet = new Set<string>();

    if (itemKeys.length > 0) {
      const { data: reads } = await supabase
        .from('notification_reads')
        .select('notification_key')
        .eq('user_id', user.id)
        .in('notification_key', itemKeys);

      if (reads) {
        reads.forEach((r) => readKeySet.add(r.notification_key));
      }
    }

    // 4. Map to NotificationItems
    const notifications: NotificationItem[] = rawItems.map((item) => ({
      key: item.categoryKey,
      title: item.title,
      subtitle: item.subtitle,
      tag: item.tag,
      tagColor: item.tagColor,
      href: item.href,
      timestamp: item.date,
      isRead: readKeySet.has(item.categoryKey),
    }));

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return { notifications, unreadCount };
  } catch (err: any) {
    return { notifications: [], unreadCount: 0, error: err.message || 'Failed to fetch notifications' };
  }
}

export async function markNotificationReadAction(notificationKey: string): Promise<{ success: boolean }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    await supabase
      .from('notification_reads')
      .upsert(
        {
          user_id: user.id,
          notification_key: notificationKey,
          read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,notification_key' }
      );

    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function markAllNotificationsReadAction(notificationKeys: string[]): Promise<{ success: boolean }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || notificationKeys.length === 0) return { success: false };

    const now = new Date().toISOString();
    const records = notificationKeys.map((key) => ({
      user_id: user.id,
      notification_key: key,
      read_at: now,
    }));

    await supabase
      .from('notification_reads')
      .upsert(records, { onConflict: 'user_id,notification_key' });

    return { success: true };
  } catch {
    return { success: false };
  }
}
