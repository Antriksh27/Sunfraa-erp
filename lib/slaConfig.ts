import { Project, ProjectStage } from '@/types/database';

export const STAGE_SLA_DAYS: Partial<Record<ProjectStage, number>> = {
  LEAD: 3,
  SITE_SURVEY_SCHEDULED: 2,
  SITE_SURVEY_DONE: 2,
  DESIGN_PENDING: 3,
  DESIGN_UPLOADED: 2,
  QUOTATION_SENT: 3,
  STALE: 7,
  PAYMENT_COLLECTED: 2,
  DIRECTOR_APPROVED: 3,
  EXECUTION_IN_PROGRESS: 10,
  CEI_IN_PROGRESS: 10,
  LIAISONING_IN_PROGRESS: 15,
  CONNECTED: 0,
  CLOSED: 0,
};

export interface ProjectSLAStatus {
  daysInStage: number;
  slaLimitDays: number;
  isOverdue: boolean; // > 1.5x SLA limit
  isWarning: boolean; // > 1.0x SLA limit
  ratio: number;
  statusText: string;
}

export function calculateProjectSLA(project: Project): ProjectSLAStatus {
  const stage = project.stage;
  const slaLimitDays = STAGE_SLA_DAYS[stage] || 3;

  if (stage === 'CONNECTED' || stage === 'CLOSED' || slaLimitDays === 0) {
    return {
      daysInStage: 0,
      slaLimitDays: 0,
      isOverdue: false,
      isWarning: false,
      ratio: 0,
      statusText: 'Completed',
    };
  }

  const updatedDate = project.updated_at ? new Date(project.updated_at).getTime() : Date.now();
  const daysInStage = Math.max(0, Math.floor((Date.now() - updatedDate) / (1000 * 60 * 60 * 24)));

  const ratio = daysInStage / slaLimitDays;
  const isOverdue = ratio >= 1.5;
  const isWarning = ratio >= 1.0 && !isOverdue;

  let statusText = 'On Track';
  if (isOverdue) statusText = `Overdue (${daysInStage}/${slaLimitDays}d)`;
  else if (isWarning) statusText = `Breaching (${daysInStage}/${slaLimitDays}d)`;

  return {
    daysInStage,
    slaLimitDays,
    isOverdue,
    isWarning,
    ratio,
    statusText,
  };
}

export interface DepartmentSLAHealth {
  department: string;
  totalActive: number;
  onTimeCount: number;
  warningCount: number;
  overdueCount: number;
  healthIndex: number; // 0 to 100%
}

export function calculateDepartmentSLAHealth(projects: Project[]): DepartmentSLAHealth[] {
  const activeProjects = projects.filter((p) => p.stage !== 'CONNECTED' && p.stage !== 'CLOSED');

  const deptStages: Record<string, ProjectStage[]> = {
    'Sales & Pre-Engineering': ['LEAD', 'SITE_SURVEY_SCHEDULED', 'SITE_SURVEY_DONE', 'QUOTATION_SENT', 'STALE'],
    'Design & CAD': ['DESIGN_PENDING', 'DESIGN_UPLOADED'],
    'Governance & Approvals': ['PAYMENT_COLLECTED', 'DIRECTOR_APPROVED'],
    'Site Execution & Warehousing': ['EXECUTION_IN_PROGRESS'],
    'Liaisoning & CEI': ['CEI_IN_PROGRESS', 'LIAISONING_IN_PROGRESS'],
  };

  return Object.entries(deptStages).map(([dept, stages]) => {
    const deptProjects = activeProjects.filter((p) => stages.includes(p.stage));
    let onTime = 0;
    let warning = 0;
    let overdue = 0;

    deptProjects.forEach((p) => {
      const sla = calculateProjectSLA(p);
      if (sla.isOverdue) overdue++;
      else if (sla.isWarning) warning++;
      else onTime++;
    });

    const total = deptProjects.length;
    const healthIndex = total > 0 ? Math.round(((onTime + warning * 0.5) / total) * 100) : 100;

    return {
      department: dept,
      totalActive: total,
      onTimeCount: onTime,
      warningCount: warning,
      overdueCount: overdue,
      healthIndex,
    };
  });
}
