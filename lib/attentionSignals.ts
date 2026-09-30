import { SupabaseClient } from '@supabase/supabase-js';
import { UserRole, Project, ProjectStage } from '@/types/database';
import { getProjectUrlForRole } from '@/lib/navigation';

export interface AttentionItem {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  href: string;
  date?: string;
  amount?: number;
}

export interface SalesDashboardData {
  leadsNeedingFollowUp: AttentionItem[];
  leadsAboutToGoStale: AttentionItem[];
  todaysScheduledSurveys: AttentionItem[];
  metrics: {
    totalLeads: number;
    staleCount: number;
    activeProposals: number;
  };
}

export interface AccountsDashboardData {
  paymentsOverdue: AttentionItem[];
  noPaymentActivity15Days: AttentionItem[];
  todaysCollectedTotal: number;
  todaysCollectedCount: number;
  metrics: {
    totalPendingValue: number;
    totalPendingCount: number;
    totalCollectedThisMonth: number;
  };
}

export interface ExecutionDashboardData {
  todaysLabourAssignments: AttentionItem[];
  idleIncompleteStages: AttentionItem[];
  metrics: {
    activeSitesCount: number;
    inProgressStagesCount: number;
  };
}

export interface StoreDashboardData {
  lowBOMQueue: AttentionItem[];
  pendingStockOutAwaitingChallan: AttentionItem[];
  metrics: {
    totalBoms: number;
    pendingDispatches: number;
  };
}

export interface DesignDashboardData {
  initialDesignQueue: AttentionItem[];
  ceiDrawingQueue: AttentionItem[];
  metrics: {
    initialQueueCount: number;
    ceiQueueCount: number;
  };
}

export interface LiaisoningDashboardData {
  discomFollowUpsDue: AttentionItem[];
  stagnantApplications: AttentionItem[];
  metrics: {
    inProgressCount: number;
    connectedThisMonth: number;
  };
}

export interface DirectorDashboardData {
  pendingApprovals: AttentionItem[];
  rollup: {
    salesAttentionCount: number;
    accountsPendingCount: number;
    accountsPendingValue: number;
    executionActiveCount: number;
    storePendingChallansCount: number;
    designQueueCount: number;
    liaisoningFollowUpsDueCount: number;
  };
}

/**
 * Fetch role-specific attention signals and metrics
 */
export async function getRoleDashboardData(
  supabase: SupabaseClient,
  role: UserRole,
  userId: string
): Promise<{
  sales?: SalesDashboardData;
  accounts?: AccountsDashboardData;
  execution?: ExecutionDashboardData;
  store?: StoreDashboardData;
  design?: DesignDashboardData;
  liaisoning?: LiaisoningDashboardData;
  director?: DirectorDashboardData;
}> {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (role === 'SALES') {
    // 1. Leads needing follow-up: in LEAD stage assigned to user
    const { data: rawLeads } = await supabase
      .from('projects')
      .select('id, client_name, phone, address, stage, kw_required, created_at')
      .eq('lead_owner_id', userId)
      .eq('stage', 'LEAD')
      .order('created_at', { ascending: true })
      .limit(10);

    const leadsNeedingFollowUp: AttentionItem[] = (rawLeads || []).map((p) => ({
      id: p.id,
      title: p.client_name,
      subtitle: `${p.kw_required} kW • ${p.phone} • ${p.address}`,
      tag: 'New Lead',
      tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
      href: getProjectUrlForRole(p.id, 'SALES'),
      date: p.created_at,
    }));

    // 2. Leads about to go stale: QUOTATION_SENT where quotation_sent_at is 10+ days old OR already STALE
    const { data: rawStale } = await supabase
      .from('projects')
      .select('id, client_name, phone, quotation_amount, quotation_sent_at, stage, created_at')
      .eq('lead_owner_id', userId)
      .in('stage', ['QUOTATION_SENT', 'STALE'])
      .order('quotation_sent_at', { ascending: true })
      .limit(10);

    const leadsAboutToGoStale: AttentionItem[] = (rawStale || [])
      .filter((p) => {
        if (p.stage === 'STALE') return true;
        if (!p.quotation_sent_at) return false;
        const sentDate = new Date(p.quotation_sent_at);
        const days = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
        return days >= 10;
      })
      .map((p) => {
        const days = p.quotation_sent_at
          ? Math.floor((now.getTime() - new Date(p.quotation_sent_at).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        return {
          id: p.id,
          title: p.client_name,
          subtitle: `Quotation ₹${(p.quotation_amount || 0).toLocaleString()} • Sent ${days} days ago`,
          tag: p.stage === 'STALE' ? 'Stale (15+ Days)' : 'Nearing Stale',
          tagColor: p.stage === 'STALE' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-orange-100 text-orange-800 border-orange-300',
          href: getProjectUrlForRole(p.id, 'SALES'),
          date: p.quotation_sent_at || p.created_at,
          amount: p.quotation_amount,
        };
      });

    // 3. Today's scheduled site surveys
    const { data: rawSurveys } = await supabase
      .from('projects')
      .select('id, client_name, phone, address, kw_required, stage, created_at')
      .eq('lead_owner_id', userId)
      .eq('stage', 'SITE_SURVEY_SCHEDULED')
      .limit(10);

    const todaysScheduledSurveys: AttentionItem[] = (rawSurveys || []).map((p) => ({
      id: p.id,
      title: p.client_name,
      subtitle: `${p.kw_required} kW • ${p.address}`,
      tag: 'Survey Scheduled',
      tagColor: 'bg-blue-100 text-blue-800 border-blue-300',
      href: `/pipeline/${p.id}/site-survey`,
      date: p.created_at,
    }));

    return {
      sales: {
        leadsNeedingFollowUp,
        leadsAboutToGoStale,
        todaysScheduledSurveys,
        metrics: {
          totalLeads: rawLeads?.length || 0,
          staleCount: leadsAboutToGoStale.length,
          activeProposals: (rawStale || []).length,
        },
      },
    };
  }

  if (role === 'ACCOUNTS') {
    // 1. Payments overdue/aging: PENDING payments where quotation_sent_at is 7+ days old
    const { data: rawPending } = await supabase
      .from('projects')
      .select('id, client_name, phone, address, quotation_amount, quotation_sent_at, stage')
      .eq('payment_status', 'PENDING')
      .not('quotation_amount', 'is', null)
      .order('quotation_sent_at', { ascending: true });

    const paymentsOverdue: AttentionItem[] = (rawPending || [])
      .filter((p) => {
        if (!p.quotation_sent_at) return false;
        const days = Math.floor((now.getTime() - new Date(p.quotation_sent_at).getTime()) / (1000 * 60 * 60 * 24));
        return days >= 7;
      })
      .map((p) => {
        const days = Math.floor((now.getTime() - new Date(p.quotation_sent_at!).getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: p.id,
          title: p.client_name,
          subtitle: `Amount: ₹${(p.quotation_amount || 0).toLocaleString()} • Sent ${days} days ago`,
          tag: `${days} Days Aging`,
          tagColor: days >= 15 ? 'bg-red-100 text-red-800 border-red-300' : 'bg-amber-100 text-amber-800 border-amber-300',
          href: getProjectUrlForRole(p.id, 'ACCOUNTS'),
          amount: p.quotation_amount,
        };
      });

    // 2. Projects with no payment activity in 15+ days
    const noPaymentActivity15Days: AttentionItem[] = (rawPending || [])
      .filter((p) => {
        if (!p.quotation_sent_at) return false;
        const days = Math.floor((now.getTime() - new Date(p.quotation_sent_at).getTime()) / (1000 * 60 * 60 * 24));
        return days >= 15;
      })
      .map((p) => ({
        id: p.id,
        title: p.client_name,
        subtitle: `₹${(p.quotation_amount || 0).toLocaleString()} • ${p.phone}`,
        tag: '15+ Days Dormant',
        tagColor: 'bg-red-100 text-red-800 border-red-300',
        href: getProjectUrlForRole(p.id, 'ACCOUNTS'),
        amount: p.quotation_amount,
      }));

    // 3. Today's collected total
    const { data: rawCollectedToday } = await supabase
      .from('projects')
      .select('id, client_name, quotation_amount, payment_collected_at')
      .eq('payment_status', 'COLLECTED')
      .gte('payment_collected_at', `${todayStr}T00:00:00.000Z`)
      .lte('payment_collected_at', `${todayStr}T23:59:59.999Z`);

    const todaysCollectedTotal = (rawCollectedToday || []).reduce(
      (acc, p) => acc + (Number(p.quotation_amount) || 0),
      0
    );

    const totalPendingValue = (rawPending || []).reduce(
      (acc, p) => acc + (Number(p.quotation_amount) || 0),
      0
    );

    return {
      accounts: {
        paymentsOverdue,
        noPaymentActivity15Days,
        todaysCollectedTotal,
        todaysCollectedCount: rawCollectedToday?.length || 0,
        metrics: {
          totalPendingValue,
          totalPendingCount: rawPending?.length || 0,
          totalCollectedThisMonth: todaysCollectedTotal,
        },
      },
    };
  }

  if (role === 'SITE_EXECUTION' || role === 'HEAD_ENGINEER') {
    // 1. Today's labour assignments
    const { data: rawAssignments } = await supabase
      .from('labour_assignments')
      .select(`
        id,
        stage,
        assigned_date,
        project:projects!labour_assignments_project_id_fkey(id, client_name, address),
        team:labour_teams!labour_assignments_labour_team_id_fkey(name, headcount)
      `)
      .order('assigned_date', { ascending: false })
      .limit(10);

    const todaysLabourAssignments: AttentionItem[] = (rawAssignments || []).map((a: any) => ({
      id: a.id,
      title: a.project?.client_name || 'Site Assignment',
      subtitle: `Team: ${a.team?.name || 'Assigned'} (${a.team?.headcount || 0} crew) • Stage: ${a.stage}`,
      tag: a.stage.replace('_', ' '),
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      href: role === 'HEAD_ENGINEER' ? '/execution-overview' : (a.project?.id ? `/execution/${a.project.id}` : '/execution'),
      date: a.assigned_date,
    }));

    // 2. Incomplete stages sitting idle
    const { data: rawExecutionProjects } = await supabase
      .from('projects')
      .select(`
        id,
        client_name,
        address,
        stage,
        kw_required,
        progress:execution_stage_progress(stage, completed_at)
      `)
      .eq('stage', 'EXECUTION_IN_PROGRESS')
      .limit(10);

    const idleIncompleteStages: AttentionItem[] = (rawExecutionProjects || []).map((p: any) => {
      const completedCount = p.progress?.length || 0;
      return {
        id: p.id,
        title: p.client_name,
        subtitle: `${p.kw_required} kW • ${completedCount}/4 stages complete • ${p.address}`,
        tag: `${completedCount}/4 Done`,
        tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
        href: getProjectUrlForRole(p.id, role),
      };
    });

    return {
      execution: {
        todaysLabourAssignments,
        idleIncompleteStages,
        metrics: {
          activeSitesCount: rawExecutionProjects?.length || 0,
          inProgressStagesCount: todaysLabourAssignments.length,
        },
      },
    };
  }

  if (role === 'STORE_PURCHASE') {
    // 1. Low BOM-fill queue: Projects approved or in execution with few or no items
    const { data: rawBOMs } = await supabase
      .from('boms')
      .select(`
        id,
        project_id,
        created_at,
        project:projects!boms_project_id_fkey(id, client_name, kw_required, stage),
        items:bom_items(id)
      `)
      .order('created_at', { ascending: false });

    const lowBOMQueue: AttentionItem[] = (rawBOMs || [])
      .filter((b: any) => (b.items?.length || 0) < 3)
      .map((b: any) => ({
        id: b.id,
        title: b.project?.client_name || 'BOM Draft',
        subtitle: `${b.project?.kw_required || ''} kW • Only ${b.items?.length || 0} items defined`,
        tag: 'Incomplete BOM',
        tagColor: 'bg-orange-100 text-orange-800 border-orange-300',
        href: getProjectUrlForRole(b.project?.id || b.project_id || b.id, 'STORE_PURCHASE'),
      }));

    // 2. Pending stock-out awaiting challan: Projects in execution with BOMs but no delivery challans
    const { data: rawChallanProjects } = await supabase
      .from('projects')
      .select(`
        id,
        client_name,
        kw_required,
        stage,
        challans:delivery_challans(id)
      `)
      .in('stage', ['DIRECTOR_APPROVED', 'EXECUTION_IN_PROGRESS']);

    const pendingStockOutAwaitingChallan: AttentionItem[] = (rawChallanProjects || [])
      .filter((p: any) => (p.challans?.length || 0) === 0)
      .map((p: any) => ({
        id: p.id,
        title: p.client_name,
        subtitle: `${p.kw_required} kW • Approved for dispatch, awaiting Delivery Challan`,
        tag: 'Needs Challan',
        tagColor: 'bg-purple-100 text-purple-800 border-purple-300',
        href: getProjectUrlForRole(p.id, 'STORE_PURCHASE'),
      }));

    return {
      store: {
        lowBOMQueue,
        pendingStockOutAwaitingChallan,
        metrics: {
          totalBoms: rawBOMs?.length || 0,
          pendingDispatches: pendingStockOutAwaitingChallan.length,
        },
      },
    };
  }

  if (role === 'DESIGN') {
    // 1. Initial CAD design queue
    const { data: rawInitial } = await supabase
      .from('projects')
      .select('id, client_name, category, kw_required, phone, created_at')
      .in('stage', ['SITE_SURVEY_DONE', 'DESIGN_PENDING'])
      .order('created_at', { ascending: true });

    const initialDesignQueue: AttentionItem[] = (rawInitial || []).map((p) => ({
      id: p.id,
      title: p.client_name,
      subtitle: `${p.kw_required} kW • ${p.category.replace('_', ' ')} • Survey Completed`,
      tag: 'Initial CAD Required',
      tagColor: 'bg-teal-100 text-teal-800 border-teal-300',
      href: getProjectUrlForRole(p.id, 'DESIGN'),
      date: p.created_at,
    }));

    // 2. CEI Drawing queue
    const { data: rawCEI } = await supabase
      .from('projects')
      .select('id, client_name, category, kw_required, phone, created_at')
      .eq('cei_required', true)
      .in('stage', [
        'PAYMENT_COLLECTED',
        'DIRECTOR_APPROVED',
        'EXECUTION_IN_PROGRESS',
        'CEI_IN_PROGRESS',
      ])
      .order('created_at', { ascending: true });

    const ceiDrawingQueue: AttentionItem[] = (rawCEI || []).map((p) => ({
      id: p.id,
      title: p.client_name,
      subtitle: `${p.kw_required} kW • CEI Grid Approval Scheme`,
      tag: 'CEI Schematic Due',
      tagColor: 'bg-purple-100 text-purple-800 border-purple-300',
      href: getProjectUrlForRole(p.id, 'DESIGN'),
      date: p.created_at,
    }));

    return {
      design: {
        initialDesignQueue,
        ceiDrawingQueue,
        metrics: {
          initialQueueCount: initialDesignQueue.length,
          ceiQueueCount: ceiDrawingQueue.length,
        },
      },
    };
  }

  if (role === 'LIAISONING') {
    // 1. DISCOM follow-ups due (7-day rule)
    const { data: rawLiaisoning } = await supabase
      .from('projects')
      .select(`
        id,
        client_name,
        phone,
        connection_number,
        stage,
        liaisoning_record:liaisoning_records(
          id,
          connected_at,
          govt_estimate_amount,
          follow_up_logs:discom_follow_up_logs(follow_up_date, note)
        )
      `)
      .in('stage', ['PAYMENT_COLLECTED', 'DIRECTOR_APPROVED', 'EXECUTION_IN_PROGRESS', 'LIAISONING_IN_PROGRESS']);

    const discomFollowUpsDue: AttentionItem[] = (rawLiaisoning || [])
      .filter((p: any) => {
        const record = Array.isArray(p.liaisoning_record) ? p.liaisoning_record[0] : p.liaisoning_record;
        if (!record || record.connected_at) return false;
        const logs = record.follow_up_logs || [];
        if (logs.length === 0) return true;
        const lastDate = new Date(logs[0].follow_up_date);
        const days = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        return days >= 7;
      })
      .map((p: any) => ({
        id: p.id,
        title: p.client_name,
        subtitle: `Connection: ${p.connection_number || 'Pending'} • 7+ days since last DISCOM touchpoint`,
        tag: 'DISCOM Follow-Up Due',
        tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
        href: getProjectUrlForRole(p.id, 'LIAISONING'),
      }));

    const stagnantApplications: AttentionItem[] = (rawLiaisoning || [])
      .filter((p: any) => {
        const record = Array.isArray(p.liaisoning_record) ? p.liaisoning_record[0] : p.liaisoning_record;
        return record && !record.govt_estimate_amount;
      })
      .map((p: any) => ({
        id: p.id,
        title: p.client_name,
        subtitle: `Connection: ${p.connection_number || 'Pending'} • Awaiting Govt Estimate Quotation`,
        tag: 'Estimate Pending',
        tagColor: 'bg-blue-100 text-blue-800 border-blue-300',
        href: getProjectUrlForRole(p.id, 'LIAISONING'),
      }));

    return {
      liaisoning: {
        discomFollowUpsDue,
        stagnantApplications,
        metrics: {
          inProgressCount: rawLiaisoning?.length || 0,
          connectedThisMonth: 0,
        },
      },
    };
  }

  // DIRECTOR: Aggregated rollup across all modules
  if (role === 'DIRECTOR') {
    // 1. Pending approvals count
    const { data: rawApprovals } = await supabase
      .from('projects')
      .select('id, client_name, category, kw_required, quotation_amount, payment_collected_at')
      .eq('stage', 'PAYMENT_COLLECTED')
      .order('payment_collected_at', { ascending: true });

    const pendingApprovals: AttentionItem[] = (rawApprovals || []).map((p) => ({
      id: p.id,
      title: p.client_name,
      subtitle: `${p.kw_required} kW • Payment: ₹${(p.quotation_amount || 0).toLocaleString()} Collected`,
      tag: 'Awaiting Director Sign-off',
      tagColor: 'bg-purple-100 text-purple-800 border-purple-300',
      href: `/director/approvals`,
      amount: p.quotation_amount,
    }));

    // Rollup counts
    const { count: salesStaleCount } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .in('stage', ['STALE']);

    const { data: pendingAccounts } = await supabase
      .from('projects')
      .select('quotation_amount')
      .eq('payment_status', 'PENDING')
      .not('quotation_amount', 'is', null);

    const accountsPendingValue = (pendingAccounts || []).reduce(
      (acc, p) => acc + (Number(p.quotation_amount) || 0),
      0
    );

    const { count: executionActiveCount } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('stage', 'EXECUTION_IN_PROGRESS');

    const { count: designQueueCount } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .in('stage', ['SITE_SURVEY_DONE', 'DESIGN_PENDING']);

    return {
      director: {
        pendingApprovals,
        rollup: {
          salesAttentionCount: salesStaleCount || 0,
          accountsPendingCount: pendingAccounts?.length || 0,
          accountsPendingValue,
          executionActiveCount: executionActiveCount || 0,
          storePendingChallansCount: 0,
          designQueueCount: designQueueCount || 0,
          liaisoningFollowUpsDueCount: 0,
        },
      },
    };
  }

  return {};
  } catch (error) {
    console.error('Error fetching role dashboard data:', error);
    // Return graceful fallbacks to guarantee zero blank pages
    if (role === 'SALES') {
      return {
        sales: {
          leadsNeedingFollowUp: [],
          leadsAboutToGoStale: [],
          todaysScheduledSurveys: [],
          metrics: { totalLeads: 0, staleCount: 0, activeProposals: 0 },
        },
      };
    }
    if (role === 'ACCOUNTS') {
      return {
        accounts: {
          paymentsOverdue: [],
          noPaymentActivity15Days: [],
          todaysCollectedTotal: 0,
          todaysCollectedCount: 0,
          metrics: { totalPendingValue: 0, totalPendingCount: 0, totalCollectedThisMonth: 0 },
        },
      };
    }
    if (role === 'SITE_EXECUTION' || role === 'HEAD_ENGINEER') {
      return {
        execution: {
          todaysLabourAssignments: [],
          idleIncompleteStages: [],
          metrics: { activeSitesCount: 0, inProgressStagesCount: 0 },
        },
      };
    }
    if (role === 'STORE_PURCHASE') {
      return {
        store: {
          lowBOMQueue: [],
          pendingStockOutAwaitingChallan: [],
          metrics: { totalBoms: 0, pendingDispatches: 0 },
        },
      };
    }
    if (role === 'DESIGN') {
      return {
        design: {
          initialDesignQueue: [],
          ceiDrawingQueue: [],
          metrics: { initialQueueCount: 0, ceiQueueCount: 0 },
        },
      };
    }
    if (role === 'LIAISONING') {
      return {
        liaisoning: {
          discomFollowUpsDue: [],
          stagnantApplications: [],
          metrics: { inProgressCount: 0, connectedThisMonth: 0 },
        },
      };
    }
    if (role === 'DIRECTOR') {
      return {
        director: {
          pendingApprovals: [],
          rollup: {
            salesAttentionCount: 0,
            accountsPendingCount: 0,
            accountsPendingValue: 0,
            executionActiveCount: 0,
            storePendingChallansCount: 0,
            designQueueCount: 0,
            liaisoningFollowUpsDueCount: 0,
          },
        },
      };
    }
    return {};
  }
}
