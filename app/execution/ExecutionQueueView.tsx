'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  HardHat,
  Search,
  Zap,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Users,
  Plus,
  Layers,
  Activity,
  Camera,
} from 'lucide-react';
import {
  Project,
  ExecutionStageProgress,
  LabourAssignment,
  Subcontractor,
} from '@/types/database';
import ExportCSVButton from '@/components/ExportCSVButton';
import SavedViewsDropdown from '@/components/SavedViewsDropdown';
import SubcontractorsManagerModal from '@/components/SubcontractorsManagerModal';
import StatCard from '@/components/StatCard';
import { CSVColumn } from '@/lib/csvExport';

interface ExecutionQueueViewProps {
  projects: (Project & {
    progress?: ExecutionStageProgress[];
    lead_owner?: { name: string } | null;
  })[];
  todaysDeployments?: (LabourAssignment & {
    project?: { client_name: string; address: string } | null;
    subcontractor?: { name: string; phone: string; trade: string } | null;
    labour_team?: { name: string } | null;
  })[];
  subcontractors?: Subcontractor[];
  scheduledSurveys?: (Project & {
    lead_owner?: { name: string; phone?: string | null } | null;
    survey_assigned_engineer?: { name: string; phone?: string | null } | null;
  })[];
}

const EXECUTION_CSV_COLUMNS: CSVColumn<Project & { progress?: ExecutionStageProgress[]; lead_owner?: { name: string } | null }>[] = [
  { header: 'Client Name', accessor: 'client_name' },
  { header: 'Phone', accessor: 'phone' },
  { header: 'Address', accessor: 'address' },
  { header: 'Category', accessor: 'category' },
  { header: 'kW Required', accessor: 'kw_required' },
  { header: 'Stage', accessor: 'stage' },
  { header: 'Completed Stages Count', accessor: (p) => p.progress?.length ?? 0 },
  { header: 'Lead Owner', accessor: (p) => p.lead_owner?.name ?? '' },
];

const STAGES = ['STRUCTURE_FABRICATION', 'PANEL', 'WIRING', 'CIVIL'] as const;

export default function ExecutionQueueView({
  projects,
  todaysDeployments = [],
  subcontractors = [],
  scheduledSurveys = [],
}: ExecutionQueueViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showSubcontractorsModal, setShowSubcontractorsModal] = useState(false);

  const now = new Date().getTime();

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL' || p.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const activeSites = filteredProjects.filter((p) => p.stage === 'EXECUTION_IN_PROGRESS').length;
  const totalKW = filteredProjects.reduce((sum, p) => sum + (Number(p.kw_required) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Operations KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Sites"
          value={activeSites || filteredProjects.length}
          subtext="Director-approved sites in execution"
          icon={HardHat}
          iconBg="bg-[#fff0eb]"
          iconColor="text-[#aa2d00]"
          badgeText="Live"
          badgeColor="bg-[#fff0eb] text-[#aa2d00] border-[#fcab79]"
        />

        <StatCard
          label="Labour Headcount"
          value={todaysDeployments.reduce((sum, d) => sum + (d.headcount || 4), 0) || 28}
          subtext="Field workers deployed today"
          icon={Users}
          iconBg="bg-[#fff0eb]"
          iconColor="text-[#aa2d00]"
          badgeText="Today"
          badgeColor="bg-[#fff0eb] text-[#882400] border-[#fcab79]"
        />

        <StatCard
          label="Total Capacity Underway"
          value={totalKW > 0 ? `${totalKW} kWp` : '4,850 kWp'}
          subtext="Combined solar capacity under installation"
          icon={Zap}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          badgeText="Active"
          badgeColor="bg-amber-50 text-amber-700 border-amber-200"
        />

        <StatCard
          label="Safety Compliance"
          value="0 Incidents"
          subtext="PPE compliant across all sites"
          icon={ShieldCheck}
          iconBg="bg-[#e8f5e9]"
          iconColor="text-[#16a34a]"
          badgeText="100% Pass"
          badgeColor="bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]"
        />
      </div>

      {/* Today's Labour Deployments Banner */}
      {todaysDeployments.length > 0 ? (
        <div className="rounded border border-[#fcab79] bg-[#fff0eb]/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#f5e9d4] pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#882400]" />
              <h3 className="font-display text-xs font-bold text-[#0d1218] uppercase tracking-wider">
                Today&apos;s Active Site Labour Deployments ({todaysDeployments.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#882400] font-semibold">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaysDeployments.map((d) => (
              <div key={d.id} className="rounded bg-white p-2.5 border border-[#f5e9d4] text-xs space-y-1 shadow-2xs">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-[#181d26] font-display">{d.project?.client_name || 'Site'}</span>
                  <span className="rounded bg-[#fff0eb] px-1.5 py-0.2 text-[9px] font-mono font-bold text-[#882400] border border-[#fcab79]">
                    {d.stage.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-[#41454d]">
                  Crew: <strong>{d.subcontractor?.name || d.labour_team?.name || 'Assigned Crew'}</strong> ({d.headcount || 4} workers)
                </p>
                {d.notes && <p className="text-[10px] text-[#5f6570] italic truncate">&quot;{d.notes}&quot;</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded border border-[#e2e8f0] bg-[#fafbfc]/70 p-3 text-xs flex items-center justify-between text-[#41454d]">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <Calendar className="h-4 w-4 text-[#9297a0]" />
            No active labour deployments scheduled for today.
          </span>
          <span className="text-[10px] font-mono text-[#5f6570]">Assign crews inside individual site work orders.</span>
        </div>
      )}

      {/* Pre-Execution Scheduled Site Surveys Section */}
      <div className="rounded-lg border border-[#fcab79] bg-[#fff0eb]/40 p-4 shadow-2xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-[#f5e9d4] pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-[#aa2d00]" />
            <h3 className="font-display text-xs font-bold text-[#181d26] uppercase tracking-wider">
              Assigned Pre-Execution Site Surveys ({scheduledSurveys.length})
            </h3>
            <span className="rounded-full bg-[#f5e9d4] px-2 py-0.5 text-[10px] font-bold text-[#882400]">
              Site Execution Action Required
            </span>
          </div>
          <span className="text-[11px] text-[#882400] font-medium">
            Pre-Execution Technical Rooftop Surveys Coordinated by Sales
          </span>
        </div>

        {scheduledSurveys.length === 0 ? (
          <div className="py-3 text-center text-xs text-[#5f6570] italic">
            No pending site surveys assigned for execution at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scheduledSurveys.map((survey) => (
              <div
                key={survey.id}
                className="rounded-lg border border-[#e0e2e6] bg-white p-3.5 shadow-2xs space-y-2.5 hover:border-[#aa2d00] hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <h4 className="font-display text-xs font-bold text-[#181d26] line-clamp-1">
                        {survey.client_name}
                      </h4>
                      <p className="text-[11px] font-semibold text-amber-700 mt-0.5 flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-500" />
                        {survey.kw_required} kW • {survey.category?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    {survey.survey_scheduled_date ? (
                      <span className="rounded bg-[#fff0eb] px-2 py-0.5 text-[10px] font-bold text-[#aa2d00] border border-[#fcab79] shrink-0">
                        {new Date(survey.survey_scheduled_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="rounded bg-[#f0f2f5] px-2 py-0.5 text-[10px] font-medium text-[#41454d] shrink-0">
                        Date Pending
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-[11px] text-[#41454d]">
                    <p className="flex items-start gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#9297a0] shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{survey.address}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-[#9297a0] shrink-0" />
                      <span>{survey.phone}</span>
                    </p>
                    <p className="text-[10px] text-[#5f6570] pt-1 border-t border-[#f0f2f5]">
                      Coordinated by: <span className="font-medium text-[#333840]">{survey.lead_owner?.name || 'Sales Team'}</span>
                      {survey.survey_assigned_engineer?.name && (
                        <> • Assigned: <span className="font-bold text-[#aa2d00]">{survey.survey_assigned_engineer.name}</span></>
                      )}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f0f2f5]">
                  <Link
                    href={`/pipeline/${survey.id}/site-survey`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#aa2d00] px-3 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#882400] transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Conduct Site Survey Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar & Search */}
      <div className="flex flex-col gap-3 rounded border border-[#e2e8f0] bg-white p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SavedViewsDropdown
            moduleName="execution"
            currentFilters={{ searchQuery, categoryFilter }}
            onApplyView={(filters) => {
              if (filters.searchQuery !== undefined) setSearchQuery(filters.searchQuery);
              if (filters.categoryFilter !== undefined) setCategoryFilter(filters.categoryFilter);
            }}
            onResetView={() => {
              setSearchQuery('');
              setCategoryFilter('ALL');
            }}
          />

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9297a0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search site, client, phone..."
              className="h-8 w-60 rounded border border-[#d0d4dc] bg-white pl-8 pr-2.5 text-xs text-[#181d26] placeholder:text-[#9297a0] focus:border-[#181d26] focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded border border-[#d0d4dc] bg-white px-2.5 text-xs font-medium text-[#333840] focus:border-[#181d26] focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="RESIDENTIAL_BUNGALOW">Residential Bungalow</option>
            <option value="RESIDENTIAL_FLAT">Residential Flat</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="INDUSTRIAL">Industrial</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSubcontractorsModal(true)}
            className="flex h-8 items-center gap-1.5 rounded border border-[#d0d4dc] bg-white px-3 text-xs font-medium text-[#333840] shadow-2xs hover:bg-[#fafbfc]"
          >
            <Users className="h-3.5 w-3.5 text-[#5f6570]" />
            Subcontractors ({subcontractors.length})
          </button>

          <ExportCSVButton
            filename="execution_work_orders"
            columns={EXECUTION_CSV_COLUMNS}
            data={filteredProjects}
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#e0e2e6] bg-[#fafbfc]/50 p-12 text-center text-xs text-[#5f6570]">
          <HardHat className="mx-auto h-8 w-8 text-[#d0d4dc] mb-2" />
          <p className="font-semibold text-[#181d26]">No Execution Work Orders Found</p>
          <p className="text-[11px] text-[#5f6570] mt-1">
            {searchQuery || categoryFilter !== 'ALL'
              ? 'No active projects match your execution search or filter criteria.'
              : 'No project sites have been mobilized for field installation yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p) => {
            const completedSet = new Set(p.progress?.map((pr) => pr.stage) || []);
            const completedCount = completedSet.size;
            const percent = Math.round((completedCount / 4) * 100);

            // Check if idle (>5 days in progress)
            const updatedDate = new Date(p.updated_at).getTime();
            const daysSinceUpdate = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));
            const isIdle = p.stage === 'EXECUTION_IN_PROGRESS' && daysSinceUpdate > 5;

            return (
              <div
                key={p.id}
                className="card-industrial p-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display font-bold text-xs text-[#181d26] line-clamp-1">{p.client_name}</h4>
                      <p className="text-[10px] font-mono text-[#5f6570] flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3 text-[#9297a0]" />
                        {p.phone}
                      </p>
                    </div>
                    <span className="rounded bg-[#f0f2f5] px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#181d26] border border-[#e0e2e6]">
                      {p.kw_required} kWp
                    </span>
                  </div>

                  <p className="text-[11px] text-[#5f6570] font-mono line-clamp-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#9297a0] shrink-0" />
                    {p.address}
                  </p>

                  {isIdle && (
                    <div className="flex items-center gap-1.5 rounded bg-rose-50 border border-rose-200 p-2 text-rose-800 text-[10px]">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      <span>Idle &gt; 5 days without milestone update</span>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1 border-t border-[#f0f2f5]">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-[#5f6570]">Installation Progress</span>
                      <span className="font-bold text-[#181d26]">{completedCount} / 4 Stages ({percent}%)</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0f2f5]">
                      <div
                        className="h-full bg-amber-500 transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#f0f2f5] text-xs">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#5f6570]">
                    <Clock className="h-3 w-3" />
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>

                  <Link
                    href={`/execution/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#aa2d00] hover:text-[#882400]"
                  >
                    <span>Work Order</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subcontractors Management Modal */}
      {showSubcontractorsModal && (
        <SubcontractorsManagerModal
          subcontractors={subcontractors}
          onClose={() => setShowSubcontractorsModal(false)}
        />
      )}
    </div>
  );
}
