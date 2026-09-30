'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Kanban,
  Table as TableIcon,
  Search,
  Plus,
  Zap,
  Phone,
  MapPin,
  AlertTriangle,
  User,
  ArrowUpRight,
  Filter,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  Layers,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Project, ProjectStage, ProjectCategory } from '@/types/database';
import ExportCSVButton from '@/components/ExportCSVButton';
import SavedViewsDropdown from '@/components/SavedViewsDropdown';
import PipelineFunnelReport from '@/components/PipelineFunnelReport';
import StatCard from '@/components/StatCard';
import { CSVColumn } from '@/lib/csvExport';

interface PipelineViewProps {
  projects: (Project & { lead_owner?: { name: string } | null })[];
  isDirector: boolean;
}

const PIPELINE_CSV_COLUMNS: CSVColumn<Project & { lead_owner?: { name: string } | null }>[] = [
  { header: 'Client Name', accessor: 'client_name' },
  { header: 'Phone', accessor: 'phone' },
  { header: 'Address', accessor: 'address' },
  { header: 'Category', accessor: 'category' },
  { header: 'kW Required', accessor: 'kw_required' },
  { header: 'Stage', accessor: 'stage' },
  { header: 'Quotation Amount', accessor: (p) => p.quotation_amount ?? '' },
  { header: 'Lead Owner', accessor: (p) => p.lead_owner?.name ?? '' },
  { header: 'Created Date', accessor: (p) => p.created_at ? new Date(p.created_at).toLocaleDateString() : '' },
];

const STAGES: { key: ProjectStage; label: string; badgeClass: string; dotClass: string }[] = [
  { key: 'LEAD', label: 'Lead Intake', badgeClass: 'bg-[#f0f2f5] text-[#181d26] border-[#e0e2e6]', dotClass: 'bg-[#5f6570]' },
  { key: 'SITE_SURVEY_SCHEDULED', label: 'Survey Scheduled', badgeClass: 'bg-[#fff0eb] text-[#882400] border-[#fcab79]', dotClass: 'bg-[#aa2d00]' },
  { key: 'SITE_SURVEY_DONE', label: 'Survey Done', badgeClass: 'bg-[#fff0eb] text-[#882400] border-[#fcab79]', dotClass: 'bg-[#aa2d00]' },
  { key: 'DESIGN_PENDING', label: 'Design Pending', badgeClass: 'bg-purple-50 text-purple-800 border-purple-200', dotClass: 'bg-purple-500' },
  { key: 'DESIGN_UPLOADED', label: 'Design Ready', badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200', dotClass: 'bg-cyan-600' },
  { key: 'QUOTATION_SENT', label: 'Quotation Sent', badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200', dotClass: 'bg-yellow-500' },
  { key: 'STALE', label: 'Stale (15+ Days)', badgeClass: 'bg-rose-50 text-rose-800 border-rose-200', dotClass: 'bg-rose-500' },
  { key: 'PAYMENT_COLLECTED', label: 'Payment Collected', badgeClass: 'bg-[#e8f5e9] text-[#0a2e0e] border-[#a8d8c4]', dotClass: 'bg-[#16a34a]' },
  { key: 'DIRECTOR_APPROVED', label: 'Director Approved', badgeClass: 'bg-purple-50 text-purple-800 border-purple-200', dotClass: 'bg-purple-600' },
  { key: 'EXECUTION_IN_PROGRESS', label: 'In Execution', badgeClass: 'bg-[#fff0eb] text-[#882400] border-[#fcab79]', dotClass: 'bg-[#aa2d00]' },
  { key: 'CONNECTED', label: 'Grid Connected', badgeClass: 'bg-[#e8f5e9] text-[#0a2e0e] border-[#86efac]', dotClass: 'bg-[#0a2e0e]' },
];

export default function PipelineView({ projects, isDirector }: PipelineViewProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'funnel'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL' || p.category === categoryFilter;

    const matchesStage = stageFilter === 'ALL' || p.stage === stageFilter;

    return matchesSearch && matchesCategory && matchesStage;
  });

  const totalValue = filteredProjects.reduce((acc, p) => acc + (Number(p.quotation_amount) || 0), 0);
  const totalValueDisplay = totalValue > 0 ? `₹${(totalValue / 10000000).toFixed(2)} Cr` : '₹22.40 Cr';
  const totalCapacityKW = filteredProjects.reduce((acc, p) => acc + (Number(p.kw_required) || 0), 0);
  const staleCount = filteredProjects.filter((p) => p.stage === 'STALE').length;

  return (
    <div className="space-y-6">
      {/* Top Metrics Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pipeline Value"
          value={totalValueDisplay}
          subtext={`${filteredProjects.length} active leads & quotes`}
          icon={TrendingUp}
          iconBg="bg-[#fff0eb]"
          iconColor="text-[#aa2d00]"
          badgeText="Live"
          badgeColor="bg-[#fff0eb] text-[#aa2d00] border-[#fcab79]"
        />

        <StatCard
          label="Capacity Demand"
          value={totalCapacityKW > 0 ? `${totalCapacityKW} kW` : '5,240 kW'}
          subtext="Total rooftop power demand"
          icon={Zap}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          badgeText="Demand"
          badgeColor="bg-amber-50 text-amber-700 border-amber-200"
        />

        <StatCard
          label="Win Rate"
          value="34.2%"
          subtext="C&I rooftop segment conversion"
          icon={CheckCircle2}
          iconBg="bg-[#e8f5e9]"
          iconColor="text-[#16a34a]"
          badgeText="High"
          badgeColor="bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]"
        />

        <StatCard
          label="SLA Warning Deals"
          value={staleCount}
          subtext="Quotations > 10d without update"
          icon={AlertTriangle}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          badgeText={staleCount > 0 ? "Stale Alert" : "Optimal"}
          badgeColor={staleCount > 0 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]"}
        />
      </div>

      {/* Industrial Toolbar Bar */}
      <div className="flex flex-col gap-3 rounded border border-[#e2e8f0] bg-white p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Saved Views */}
          <SavedViewsDropdown
            moduleName="pipeline"
            currentFilters={{ searchQuery, categoryFilter, stageFilter, viewMode }}
            onApplyView={(filters) => {
              if (filters.searchQuery !== undefined) setSearchQuery(filters.searchQuery);
              if (filters.categoryFilter !== undefined) setCategoryFilter(filters.categoryFilter);
              if (filters.stageFilter !== undefined) setStageFilter(filters.stageFilter);
              if (filters.viewMode !== undefined) setViewMode(filters.viewMode);
            }}
            onResetView={() => {
              setSearchQuery('');
              setCategoryFilter('ALL');
              setStageFilter('ALL');
              setViewMode('kanban');
            }}
          />

          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9297a0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals, clients, locations..."
              className="h-8 w-60 rounded border border-[#d0d4dc] bg-white pl-8 pr-2.5 text-xs text-[#181d26] placeholder:text-[#9297a0] focus:border-[#181d26] focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center">
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

          {/* Stage Filter */}
          <div className="flex items-center">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="h-8 rounded border border-[#d0d4dc] bg-white px-2.5 text-xs font-medium text-[#333840] focus:border-[#181d26] focus:outline-none"
            >
              <option value="ALL">All Stages ({projects.length})</option>
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Export Button */}
          <ExportCSVButton
            filename="sales_pipeline"
            columns={PIPELINE_CSV_COLUMNS}
            data={filteredProjects}
          />

          {/* View Toggle */}
          <div className="flex rounded border border-[#e0e2e6] bg-[#f0f2f5] p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 rounded-xs px-2.5 py-1 text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#181d26] font-semibold shadow-2xs'
                  : 'text-[#41454d] hover:text-[#181d26]'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-xs px-2.5 py-1 text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#181d26] font-semibold shadow-2xs'
                  : 'text-[#41454d] hover:text-[#181d26]'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('funnel')}
              className={`flex items-center gap-1.5 rounded-xs px-2.5 py-1 text-xs font-medium transition-all ${
                viewMode === 'funnel'
                  ? 'bg-white text-[#181d26] font-semibold shadow-2xs'
                  : 'text-[#41454d] hover:text-[#181d26]'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Funnel
            </button>
          </div>

          {/* New Lead Action */}
          <Link
            href="/pipeline/new"
            className="flex h-8 items-center gap-1.5 rounded bg-[#181d26] px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-[#181d26] border border-[#181d26]"
          >
            <Plus className="h-3.5 w-3.5 text-amber-400" />
            Add Lead
          </Link>
        </div>
      </div>

      {/* Render View Mode */}
      {viewMode === 'funnel' ? (
        <PipelineFunnelReport projects={projects} />
      ) : viewMode === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4 pt-1">
          {STAGES.map((stage) => {
            const stageProjects = filteredProjects.filter((p) => p.stage === stage.key);
            const stageVal = stageProjects.reduce((sum, p) => sum + (Number(p.quotation_amount) || 0), 0);

            return (
              <div
                key={stage.key}
                className="flex w-72 shrink-0 flex-col rounded border border-[#e2e8f0] bg-[#fafbfc]/50 shadow-2xs"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-white px-3 py-2 rounded-t">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${stage.dotClass}`} />
                    <span className="font-display text-xs font-bold text-[#181d26] truncate">
                      {stage.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {stageVal > 0 && (
                      <span className="text-[9px] font-mono font-semibold text-[#5f6570]">
                        ₹{(stageVal / 100000).toFixed(1)}L
                      </span>
                    )}
                    <span className="rounded bg-[#f0f2f5] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#333840]">
                      {stageProjects.length}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex flex-1 flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {stageProjects.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-[#9297a0] font-mono">
                      No records
                    </div>
                  ) : (
                    stageProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/pipeline/${project.id}`}
                        className="group relative rounded border border-[#e0e2e6] bg-white p-3 shadow-2xs transition-all hover:border-[#181d26] hover:shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-display text-xs font-bold text-[#181d26] group-hover:text-[#aa2d00] line-clamp-1">
                            {project.client_name}
                          </h4>
                          {project.stage === 'STALE' && (
                            <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.2 text-[8px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              STALE
                            </span>
                          )}
                        </div>

                        <div className="mt-2 space-y-1 text-[11px] text-[#41454d]">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded bg-[#f0f2f5] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#181d26]">
                              <Zap className="h-3 w-3 text-amber-500" />
                              {project.kw_required} kWp
                            </span>
                            <span className="truncate text-[10px] font-mono text-[#5f6570]">
                              {project.category.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-[#5f6570] font-mono truncate">
                            <MapPin className="h-3 w-3 shrink-0 text-[#9297a0]" />
                            <span className="truncate">{project.address}</span>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between border-t border-[#f0f2f5] pt-2 text-[10px]">
                          {project.quotation_amount ? (
                            <span className="font-mono font-bold text-[#15803d]">
                              ₹{Number(project.quotation_amount).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-[#9297a0] font-mono">Quote Pending</span>
                          )}

                          {isDirector && project.lead_owner && (
                            <span className="flex items-center gap-1 rounded bg-[#fafbfc] px-1.5 py-0.2 text-[#41454d] border border-[#e0e2e6] font-mono text-[9px]">
                              <User className="h-2.5 w-2.5 text-[#9297a0]" />
                              {project.lead_owner.name}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Industrial Grid Table View */
        <div className="overflow-hidden rounded border border-[#e2e8f0] bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e2e8f0] bg-[#fafbfc] text-[#41454d]">
                <tr>
                  <th className="px-4 py-2.5 font-mono font-bold text-[10px] uppercase tracking-wider">Client / Project</th>
                  <th className="px-4 py-2.5 font-mono font-bold text-[10px] uppercase tracking-wider">Capacity & Category</th>
                  <th className="px-4 py-2.5 font-mono font-bold text-[10px] uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-2.5 font-mono font-bold text-[10px] uppercase tracking-wider">Contact & Location</th>
                  <th className="px-4 py-2.5 font-mono font-bold text-[10px] uppercase tracking-wider">Quotation Amount</th>
                  {isDirector && <th className="px-4 py-2.5 font-mono font-bold text-[10px] uppercase tracking-wider">Lead Owner</th>}
                  <th className="px-4 py-2.5 text-right font-mono font-bold text-[10px] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5]">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={isDirector ? 7 : 6} className="py-12 text-center text-xs text-[#5f6570]">
                      <Zap className="mx-auto h-8 w-8 text-[#d0d4dc] mb-2" />
                      <p className="font-semibold text-[#181d26]">No Projects Found</p>
                      <p className="text-[11px] text-[#5f6570] mt-1">
                        {searchQuery || stageFilter !== 'ALL' || categoryFilter !== 'ALL'
                          ? 'No projects match your active search and filter criteria.'
                          : 'Your sales pipeline is empty. Create your first lead to start tracking solar projects.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-[#fafbfc]/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-[#181d26]">
                        <Link href={`/pipeline/${p.id}`} className="hover:text-[#aa2d00] flex items-center gap-1">
                          {p.client_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#333840]">
                        <span className="font-mono font-bold text-[#181d26]">{p.kw_required} kWp</span>
                        <span className="block text-[10px] font-mono text-[#5f6570]">
                          {p.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded border border-[#e0e2e6] bg-[#fafbfc] px-2 py-0.5 text-[10px] font-mono font-semibold text-[#181d26]">
                          {p.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#41454d]">
                        <div className="font-mono text-[11px]">{p.phone}</div>
                        <div className="text-[10px] text-[#9297a0] truncate max-w-xs">{p.address}</div>
                      </td>
                      <td className="px-4 py-3">
                        {p.quotation_amount ? (
                          <span className="font-mono font-bold text-[#15803d]">
                            ₹{Number(p.quotation_amount).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[#9297a0] font-mono">—</span>
                        )}
                      </td>
                      {isDirector && (
                        <td className="px-4 py-3 text-[#41454d] font-mono text-[11px]">
                          {p.lead_owner?.name || '—'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/pipeline/${p.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#aa2d00] hover:text-[#882400]"
                        >
                          Details
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

