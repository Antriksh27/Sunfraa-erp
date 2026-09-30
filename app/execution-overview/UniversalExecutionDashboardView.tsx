'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  HardHat,
  Search,
  Zap,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Users,
  CheckCircle,
  Activity,
  Layers,
  Phone,
  Building,
  UserCheck,
  FileCheck,
  ChevronRight,
  Sparkles,
  Check,
  Boxes,
  Loader2,
} from 'lucide-react';
import {
  Project,
  ExecutionStageProgress,
  LabourAssignment,
  Subcontractor,
  LabourTeam,
  Profile,
  BOM,
  BOMItem,
} from '@/types/database';
import ExportCSVButton from '@/components/ExportCSVButton';
import TeamWorkloadHeatmap from '@/components/TeamWorkloadHeatmap';
import { CSVColumn } from '@/lib/csvExport';
import { approveBOMAction } from '@/app/execution/actions';

interface UniversalExecutionDashboardViewProps {
  projects: (Project & {
    progress?: ExecutionStageProgress[];
    lead_owner?: { name: string; email?: string } | null;
    survey_assigned_engineer?: { name: string; phone?: string | null } | null;
    bom?: (BOM & { items?: BOMItem[] }) | null;
  })[];
  labourAssignments: (LabourAssignment & {
    project?: { id: string; client_name: string; address: string; kw_required: number; category: string } | null;
    subcontractor?: { id: string; name: string; phone: string; trade: string } | null;
    labour_team?: { id: string; name: string; headcount: number; available: boolean } | null;
  })[];
  subcontractors: Subcontractor[];
  labourTeams: LabourTeam[];
  teamMembers: Profile[];
  canEdit: boolean;
  currentUserRole: string;
}

const STAGES = [
  { key: 'STRUCTURE_FABRICATION', label: 'Structure Fabrication', short: 'Structure' },
  { key: 'PANEL', label: 'Panel Installation', short: 'Panel' },
  { key: 'WIRING', label: 'Wiring & Inverter', short: 'Wiring' },
  { key: 'CIVIL', label: 'Civil & Testing', short: 'Civil' },
] as const;

const EXECUTION_CSV_COLUMNS: CSVColumn<any>[] = [
  { header: 'Client Name', accessor: 'client_name' },
  { header: 'Category', accessor: 'category' },
  { header: 'kW Required', accessor: 'kw_required' },
  { header: 'Stage', accessor: 'stage' },
  { header: 'Completed Stages', accessor: (p) => p.progress?.length ?? 0 },
  { header: 'Structure Done', accessor: (p) => p.progress?.some((s: any) => s.stage === 'STRUCTURE_FABRICATION') ? 'YES' : 'NO' },
  { header: 'Panel Done', accessor: (p) => p.progress?.some((s: any) => s.stage === 'PANEL') ? 'YES' : 'NO' },
  { header: 'Wiring Done', accessor: (p) => p.progress?.some((s: any) => s.stage === 'WIRING') ? 'YES' : 'NO' },
  { header: 'Civil Done', accessor: (p) => p.progress?.some((s: any) => s.stage === 'CIVIL') ? 'YES' : 'NO' },
  { header: 'Lead Owner', accessor: (p) => p.lead_owner?.name ?? 'Unassigned' },
  { header: 'Site Address', accessor: 'address' },
  { header: 'Phone', accessor: 'phone' },
];

export default function UniversalExecutionDashboardView({
  projects,
  labourAssignments,
  subcontractors,
  labourTeams,
  teamMembers,
  canEdit,
  currentUserRole,
}: UniversalExecutionDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'matrix' | 'deployments' | 'workload'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stageProgressFilter, setStageProgressFilter] = useState('ALL');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [approvingBom, setApprovingBom] = useState(false);
  const [bomApprovalMsg, setBomApprovalMsg] = useState<{ text: string; error?: boolean } | null>(null);

  async function handleApproveBOM(bomId: string, projId: string) {
    setApprovingBom(true);
    setBomApprovalMsg(null);
    const res = await approveBOMAction(bomId, projId);
    if (res?.error) {
      setBomApprovalMsg({ text: res.error, error: true });
    } else {
      setBomApprovalMsg({ text: 'BOM approved successfully! Labour assignment is now unlocked.' });
      if (selectedProject?.bom) {
        selectedProject.bom.approved_at = new Date().toISOString();
      }
    }
    setApprovingBom(false);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysAssignments = labourAssignments.filter((a) => a.assigned_date === todayStr);

  // Compute metrics
  const totalKw = projects.reduce((sum, p) => sum + (Number(p.kw_required) || 0), 0);
  const totalSites = projects.length;

  // Stage progress counts across all projects
  const stageStats = {
    STRUCTURE_FABRICATION: projects.filter((p) =>
      p.progress?.some((pr) => pr.stage === 'STRUCTURE_FABRICATION')
    ).length,
    PANEL: projects.filter((p) =>
      p.progress?.some((pr) => pr.stage === 'PANEL')
    ).length,
    WIRING: projects.filter((p) =>
      p.progress?.some((pr) => pr.stage === 'WIRING')
    ).length,
    CIVIL: projects.filter((p) =>
      p.progress?.some((pr) => pr.stage === 'CIVIL')
    ).length,
  };

  const fullyCompletedCount = projects.filter((p) => (p.progress?.length || 0) >= 4).length;
  const todayCrewHeadcount = todaysAssignments.reduce((acc, a) => {
    return acc + (a.labour_team?.headcount || 4); // Default to standard crew of 4 if external sub
  }, 0);

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;

    let matchesStageFilter = true;
    const completedCount = p.progress?.length || 0;
    if (stageProgressFilter === 'FULLY_COMPLETE') {
      matchesStageFilter = completedCount >= 4;
    } else if (stageProgressFilter === 'IN_PROGRESS') {
      matchesStageFilter = completedCount > 0 && completedCount < 4;
    } else if (stageProgressFilter === 'NOT_STARTED') {
      matchesStageFilter = completedCount === 0;
    }

    return matchesSearch && matchesCategory && matchesStageFilter;
  });

  return (
    <div className="space-y-6">
      {/* Executive KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Active Sites */}
        <div className="rounded-xl border border-[#e0e2e6] bg-white p-4 shadow-sm hover:border-[#fcab79] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5f6570]">Active Execution Sites</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <HardHat className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-[#181d26]">{totalSites}</p>
            <span className="text-xs font-medium text-[#5f6570]">({totalKw.toFixed(1)} kW Total)</span>
          </div>
          <p className="mt-1 text-[11px] text-[#5f6570]">
            {fullyCompletedCount} sites with all 4 stages verified
          </p>
        </div>

        {/* Today's Labour Deployed */}
        <div className="rounded-xl border border-[#e0e2e6] bg-white p-4 shadow-sm hover:border-[#fcab79] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5f6570]">Labour Deployed Today</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff0eb] text-[#aa2d00] border border-[#fcab79]">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-[#181d26]">{todaysAssignments.length} Sites</p>
            <span className="text-xs font-medium text-[#aa2d00] font-mono">~{todayCrewHeadcount} crew</span>
          </div>
          <p className="mt-1 text-[11px] text-[#5f6570]">
            Across {subcontractors.length} active contractors & internal teams
          </p>
        </div>

        {/* 4-Stage Completion Index */}
        <div className="rounded-xl border border-[#e0e2e6] bg-white p-4 shadow-sm hover:border-[#fcab79] transition-all sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#5f6570]">Company-Wide Milestone Progress</span>
            <span className="text-[11px] font-mono font-bold text-[#181d26]">
              {totalSites > 0 ? Math.round(((stageStats.STRUCTURE_FABRICATION + stageStats.PANEL + stageStats.WIRING + stageStats.CIVIL) / (totalSites * 4)) * 100) : 0}% Overall
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 pt-1">
            {STAGES.map((stage) => {
              const count = stageStats[stage.key];
              const pct = totalSites > 0 ? Math.round((count / totalSites) * 100) : 0;
              return (
                <div key={stage.key} className="rounded-lg bg-[#f8fafc] border border-[#e2e8f0] p-2 text-center">
                  <span className="text-[10px] font-medium text-[#5f6570] block truncate">{stage.short}</span>
                  <p className="text-sm font-bold text-[#181d26]">{count}/{totalSites}</p>
                  <div className="mt-1 w-full bg-[#e2e8f0] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center justify-between border-b border-[#e0e2e6] overflow-x-auto text-xs">
        <div className="flex">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 font-bold transition whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'border-[#181d26] text-[#181d26] bg-[#fafbfc]'
                : 'border-transparent text-[#5f6570] hover:text-[#181d26]'
            }`}
          >
            <Layers className="h-4 w-4 text-emerald-600" />
            Execution Projects & Stage Matrix ({projects.length})
          </button>

          <button
            onClick={() => setActiveTab('deployments')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 font-bold transition whitespace-nowrap ${
              activeTab === 'deployments'
                ? 'border-[#181d26] text-[#181d26] bg-[#fafbfc]'
                : 'border-transparent text-[#5f6570] hover:text-[#181d26]'
            }`}
          >
            <Users className="h-4 w-4 text-[#aa2d00]" />
            Labour & Crew Deployment ({labourAssignments.length})
          </button>

          <button
            onClick={() => setActiveTab('workload')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 font-bold transition whitespace-nowrap ${
              activeTab === 'workload'
                ? 'border-[#181d26] text-[#181d26] bg-[#fafbfc]'
                : 'border-transparent text-[#5f6570] hover:text-[#181d26]'
            }`}
          >
            <Activity className="h-4 w-4 text-blue-600" />
            Engineer Workload & Heatmap ({teamMembers.length})
          </button>
        </div>

        <div className="py-2 pr-2">
          <ExportCSVButton
            filename={`sunfraa_execution_overview_${todayStr}`}
            columns={EXECUTION_CSV_COLUMNS}
            data={filteredProjects}
            label="Export Overview CSV"
          />
        </div>
      </div>

      {/* TAB 1: Projects & 4-Stage Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="card-airtable p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9297a0]" />
              <input
                type="text"
                placeholder="Search by client name, phone, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#d0d4dc] pl-9 pr-3 py-1.5 text-xs text-[#181d26] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-[#d0d4dc] px-2.5 py-1.5 text-xs text-[#333840] bg-white focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="RESIDENTIAL_BUNGALOW">Residential Bungalow</option>
                <option value="RESIDENTIAL_FLAT">Residential Flat</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INDUSTRIAL">Industrial</option>
              </select>

              {/* Stage Progress Filter */}
              <select
                value={stageProgressFilter}
                onChange={(e) => setStageProgressFilter(e.target.value)}
                className="rounded-lg border border-[#d0d4dc] px-2.5 py-1.5 text-xs text-[#333840] bg-white focus:outline-none"
              >
                <option value="ALL">All Progress States</option>
                <option value="NOT_STARTED">Not Started (0/4)</option>
                <option value="IN_PROGRESS">In Progress (1-3/4)</option>
                <option value="FULLY_COMPLETE">Fully Complete (4/4)</option>
              </select>
            </div>
          </div>

          {/* Projects Table */}
          <div className="card-airtable overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-airtable">
                <thead>
                  <tr>
                    <th>Site & Client</th>
                    <th>Capacity / Category</th>
                    <th>4-Stage Progress Tracker</th>
                    <th>Completion Status</th>
                    <th>Owner / Lead</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-[#5f6570]">
                        <HardHat className="mx-auto h-8 w-8 text-[#d0d4dc] mb-2" />
                        <p className="font-semibold text-[#181d26]">No matching execution projects</p>
                        <p className="text-[11px] text-[#5f6570] mt-1">
                          No active projects match your current search or filter criteria.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => {
                      const completedStages = new Set(
                        (project.progress || []).map((pr) => pr.stage)
                      );
                      const completedCount = completedStages.size;
                      const progressPct = Math.round((completedCount / 4) * 100);

                      return (
                        <tr key={project.id} className="hover:bg-[#f8fafc] transition-colors">
                          {/* Client & Address */}
                          <td>
                            <div className="flex flex-col">
                              <span className="font-bold text-[#181d26] text-xs">
                                {project.client_name}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-[#5f6570] mt-0.5 truncate max-w-[200px]">
                                <MapPin className="h-3 w-3 shrink-0 text-[#9297a0]" />
                                {project.address || 'Address pending'}
                              </span>
                              {project.phone && (
                                <span className="flex items-center gap-1 text-[10px] text-[#9297a0] mt-0.5">
                                  <Phone className="h-2.5 w-2.5 shrink-0" />
                                  {project.phone}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Capacity & Category */}
                          <td>
                            <div className="flex flex-col gap-1">
                              <span className="font-mono font-bold text-xs text-[#181d26]">
                                {project.kw_required} kW
                              </span>
                              <span className="inline-flex self-start rounded-full border border-[#e0e2e6] bg-[#f8fafc] px-2 py-0.5 text-[9px] font-semibold text-[#41454d]">
                                {project.category.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </td>

                          {/* 4-Stage Progress Visual Line */}
                          <td>
                            <div className="space-y-1.5 min-w-[280px]">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-semibold text-[#41454d]">
                                  {completedCount}/4 Stages Done
                                </span>
                                <span className="font-mono font-bold text-emerald-700">
                                  {progressPct}%
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-[#e2e8f0] rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>

                              {/* Stage Badges Grid */}
                              <div className="grid grid-cols-4 gap-1 pt-1">
                                {STAGES.map((s) => {
                                  const isDone = completedStages.has(s.key as any);
                                  const stageRecord = (project.progress || []).find((pr) => pr.stage === s.key);

                                  return (
                                    <div
                                      key={s.key}
                                      title={
                                        isDone
                                          ? `${s.label} completed on ${stageRecord?.completed_at ? new Date(stageRecord.completed_at).toLocaleDateString() : 'N/A'}${stageRecord?.comment ? ` - ${stageRecord.comment}` : ''}`
                                          : `${s.label} pending`
                                      }
                                      className={`flex items-center justify-center gap-0.5 rounded px-1.5 py-1 text-[9px] font-semibold transition-all border ${
                                        isDone
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                                          : 'bg-[#f8fafc] text-[#9297a0] border-[#e2e8f0]'
                                      }`}
                                    >
                                      {isDone ? (
                                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                                      ) : (
                                        <Clock className="h-2.5 w-2.5 text-[#9297a0] shrink-0" />
                                      )}
                                      <span className="truncate">{s.short}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>

                          {/* Completion / Execution Status */}
                          <td>
                            <div className="flex flex-col gap-1">
                              {completedCount === 4 ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                  Execution Complete
                                </span>
                              ) : completedCount > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                                  <Clock className="h-3 w-3 text-amber-600" />
                                  In Execution
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#cbd5e1] bg-[#f8fafc] px-2.5 py-0.5 text-[10px] font-semibold text-[#5f6570]">
                                  Pending Handoff
                                </span>
                              )}
                              <span className="text-[10px] text-[#9297a0]">
                                Stage: {project.stage.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </td>

                          {/* Owner / Engineer */}
                          <td>
                            <div className="text-xs">
                              <p className="font-medium text-[#181d26]">
                                {project.lead_owner?.name || 'Unassigned'}
                              </p>
                              {project.survey_assigned_engineer && (
                                <p className="text-[10px] text-[#5f6570] flex items-center gap-1 mt-0.5">
                                  <HardHat className="h-3 w-3 text-[#aa2d00]" />
                                  {project.survey_assigned_engineer.name}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Action */}
                          <td className="text-right">
                            <button
                              onClick={() => setSelectedProject(project)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#d0d4dc] bg-white px-2.5 py-1 text-xs font-semibold text-[#181d26] hover:bg-[#f8fafc] hover:border-[#181d26] transition-all shadow-2xs"
                            >
                              <span>Inspection</span>
                              <ChevronRight className="h-3.5 w-3.5 text-[#5f6570]" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Labour & Crew Deployment */}
      {activeTab === 'deployments' && (
        <div className="space-y-4">
          {/* Top Summary Banner */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e0e2e6] bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-[#5f6570]">Today's Active Deployments</span>
              <p className="mt-1 text-2xl font-bold text-[#181d26]">{todaysAssignments.length} Sites</p>
              <p className="text-[11px] text-[#5f6570] mt-0.5">Assigned for {todayStr}</p>
            </div>

            <div className="rounded-xl border border-[#e0e2e6] bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-[#5f6570]">Active Subcontractor Network</span>
              <p className="mt-1 text-2xl font-bold text-[#181d26]">{subcontractors.length} Contractors</p>
              <p className="text-[11px] text-[#5f6570] mt-0.5">Civil, Structure, & Electrical trades</p>
            </div>

            <div className="rounded-xl border border-[#e0e2e6] bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-[#5f6570]">Internal Labour Crews</span>
              <p className="mt-1 text-2xl font-bold text-[#181d26]">{labourTeams.length} Teams</p>
              <p className="text-[11px] text-[#5f6570] mt-0.5">Dedicated EPC installation force</p>
            </div>
          </div>

          {/* Deployments List Card */}
          <div className="card-airtable overflow-hidden">
            <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#aa2d00]" />
                <h3 className="font-display text-xs font-bold text-[#181d26]">
                  Labour & Crew Deployment Roster ({labourAssignments.length} Total Assignments)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold text-[#5f6570]">
                Sorted by Assignment Date
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="table-airtable">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project / Site</th>
                    <th>Assigned Crew / Subcontractor</th>
                    <th>Trade / Headcount</th>
                    <th>Execution Stage</th>
                    <th>Site Address</th>
                  </tr>
                </thead>
                <tbody>
                  {labourAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-xs text-[#5f6570]">
                        No labour deployment records found.
                      </td>
                    </tr>
                  ) : (
                    labourAssignments.map((assignment) => {
                      const isToday = assignment.assigned_date === todayStr;
                      return (
                        <tr key={assignment.id} className={isToday ? 'bg-amber-50/40 font-medium' : 'hover:bg-[#f8fafc]'}>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-[#9297a0]" />
                              <span className={`text-xs font-mono ${isToday ? 'font-bold text-[#aa2d00]' : 'text-[#181d26]'}`}>
                                {assignment.assigned_date}
                              </span>
                              {isToday && (
                                <span className="rounded-full bg-[#fff0eb] border border-[#fcab79] px-1.5 py-0.2 text-[9px] font-bold text-[#aa2d00]">
                                  TODAY
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Project */}
                          <td>
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-[#181d26]">
                                {assignment.project?.client_name || 'Project'}
                              </span>
                              <span className="text-[10px] text-[#5f6570]">
                                {assignment.project?.kw_required} kW • {assignment.project?.category?.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </td>

                          {/* Crew / Subcontractor */}
                          <td>
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-[#181d26]">
                                {assignment.subcontractor?.name || assignment.labour_team?.name || 'Assigned Crew'}
                              </span>
                              {assignment.subcontractor?.phone && (
                                <span className="text-[10px] text-[#5f6570] flex items-center gap-1">
                                  <Phone className="h-2.5 w-2.5" />
                                  {assignment.subcontractor.phone}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Trade & Headcount */}
                          <td>
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex rounded-full border border-[#e0e2e6] bg-[#f0f2f5] px-2 py-0.5 text-[10px] font-medium text-[#181d26]">
                                {assignment.subcontractor?.trade || 'General Installation'}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-[#5f6570]">
                                ({assignment.labour_team?.headcount || '4'} crew)
                              </span>
                            </div>
                          </td>

                          {/* Stage */}
                          <td>
                            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                              {assignment.stage.replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* Site Address */}
                          <td className="text-xs text-[#5f6570] max-w-xs truncate">
                            {assignment.project?.address || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Engineer Workload Heatmap */}
      {activeTab === 'workload' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#e0e2e6] bg-white p-4 shadow-sm flex items-start gap-3">
            <Activity className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
                Field Engineering Workload & Supervision Matrix
              </h4>
              <p className="text-xs text-[#5f6570] mt-1">
                Visual analysis of site ownership distribution across team members. Flags overloaded supervisors (&gt;5 concurrent projects) to optimize field execution throughput and quality control.
              </p>
            </div>
          </div>

          <TeamWorkloadHeatmap
            teamMembers={teamMembers}
            activeProjects={projects}
            canEdit={canEdit}
          />
        </div>
      )}

      {/* Project Stage Inspection Modal / Drawer */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl border border-[#e0e2e6] space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#f0f2f5] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                    {selectedProject.kw_required} kW
                  </span>
                  <span className="text-xs text-[#5f6570]">
                    {selectedProject.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#181d26]">{selectedProject.client_name}</h3>
                <p className="text-xs text-[#5f6570] flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-[#9297a0]" />
                  {selectedProject.address}
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="rounded-lg p-1.5 text-[#9297a0] hover:bg-[#f0f2f5] hover:text-[#181d26]"
              >
                ✕
              </button>
            </div>

            {/* 4 Stages Detailed Proof */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5f6570]">
                4-Stage Verification & Photo Proof Audit
              </h4>

              <div className="space-y-3">
                {STAGES.map((s) => {
                  const stageRecord = (selectedProject.progress || []).find(
                    (pr: any) => pr.stage === s.key
                  );
                  const isDone = !!stageRecord;

                  return (
                    <div
                      key={s.key}
                      className={`rounded-lg border p-3.5 transition-all ${
                        isDone
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-[#e0e2e6] bg-[#fafbfc]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isDone ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-[#9297a0]" />
                          )}
                          <span className={`text-xs font-bold ${isDone ? 'text-emerald-950' : 'text-[#5f6570]'}`}>
                            {s.label}
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isDone ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </div>

                      {stageRecord && (
                        <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60 text-xs space-y-1.5">
                          <p className="text-[11px] text-[#41454d]">
                            <strong className="text-[#181d26]">Completed At:</strong>{' '}
                            {new Date(stageRecord.completed_at).toLocaleString()}
                          </p>
                          {stageRecord.comment && (
                            <p className="text-[11px] text-[#41454d]">
                              <strong className="text-[#181d26]">Field Note:</strong>{' '}
                              {stageRecord.comment}
                            </p>
                          )}
                          {stageRecord.photo_url && (
                            <div className="pt-1">
                              <a
                                href={stageRecord.photo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
                              >
                                <FileCheck className="h-3.5 w-3.5" />
                                View Uploaded Site Proof Photo
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Technical BOM & Bill of Materials Status */}
            <div className="space-y-3 border-t border-[#f0f2f5] pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-[#aa2d00]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#181d26]">
                    Technical Bill of Materials (BOM)
                  </h4>
                </div>
                {selectedProject.bom?.approved_at ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                    BOM Approved by Head Engineer
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                    BOM Approval Pending (Labour Blocked)
                  </span>
                )}
              </div>

              {bomApprovalMsg && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                    bomApprovalMsg.error
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{bomApprovalMsg.text}</span>
                </div>
              )}

              {selectedProject.bom ? (
                <div className="rounded-lg border border-[#e0e2e6] bg-[#fafbfc] overflow-hidden text-xs">
                  <div className="p-3 bg-white border-b border-[#e0e2e6] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#181d26]">
                        {selectedProject.bom.items?.length || 0} Auto-Derived Material Items
                      </p>
                      <p className="text-[11px] text-[#5f6570]">
                        Derived from design drawings & SLD specifications
                      </p>
                    </div>

                    {!selectedProject.bom.approved_at && (currentUserRole === 'HEAD_ENGINEER' || currentUserRole === 'DIRECTOR') && (
                      <button
                        onClick={() => handleApproveBOM(selectedProject.bom.id, selectedProject.id)}
                        disabled={approvingBom}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 transition-all"
                      >
                        {approvingBom ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Approve BOM as Head Engineer
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {selectedProject.bom.items && selectedProject.bom.items.length > 0 && (
                    <div className="max-h-48 overflow-y-auto divide-y divide-[#f0f2f5]">
                      {selectedProject.bom.items.map((item: any) => (
                        <div key={item.id} className="p-2.5 flex items-center justify-between hover:bg-white transition-colors">
                          <div>
                            <span className="font-medium text-[#181d26]">{item.item_name}</span>
                            <span className="ml-2 inline-flex rounded bg-[#f0f2f5] px-1.5 py-0.2 text-[9px] font-mono text-[#5f6570]">
                              {item.category}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[#181d26]">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-[#e0e2e6] bg-[#fafbfc] p-4 text-center text-xs text-[#5f6570]">
                  No BOM created yet. Upload an Initial Design file to generate the BOM.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-[#f0f2f5] pt-4">
              <button
                onClick={() => setSelectedProject(null)}
                className="rounded-lg border border-[#d0d4dc] px-4 py-2 text-xs font-semibold text-[#333840] hover:bg-[#fafbfc]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
