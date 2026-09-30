'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  FileCheck2,
  Zap,
  Phone,
  MapPin,
  Upload,
  Clock,
  ArrowRight,
  CheckCircle2,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { Project, SiteSurvey, DesignFile } from '@/types/database';
import ExportCSVButton from '@/components/ExportCSVButton';
import SavedViewsDropdown from '@/components/SavedViewsDropdown';
import StatCard from '@/components/StatCard';
import { CSVColumn } from '@/lib/csvExport';

interface DesignQueuesViewProps {
  initialDesignQueue: (Project & { site_survey?: SiteSurvey | null })[];
  ceiDrawingQueue: (Project & { site_survey?: SiteSurvey | null })[];
  revisionQueue?: (Project & { site_survey?: SiteSurvey | null; design_files?: DesignFile[] })[];
}

const DESIGN_CSV_COLUMNS: CSVColumn<Project & { site_survey?: SiteSurvey | null }>[] = [
  { header: 'Client Name', accessor: 'client_name' },
  { header: 'Phone', accessor: 'phone' },
  { header: 'Address', accessor: 'address' },
  { header: 'Category', accessor: 'category' },
  { header: 'kW Required', accessor: 'kw_required' },
  { header: 'Stage', accessor: 'stage' },
  { header: 'CEI Required', accessor: (p) => (p.cei_required ? 'Yes' : 'No') },
  { header: 'Created Date', accessor: (p) => (p.created_at ? new Date(p.created_at).toLocaleDateString() : '') },
];

export default function DesignQueuesView({
  initialDesignQueue,
  ceiDrawingQueue,
  revisionQueue = [],
}: DesignQueuesViewProps) {
  const [activeTab, setActiveTab] = useState<'initial' | 'revisions' | 'cei'>('initial');

  const currentDataset =
    activeTab === 'initial' ? initialDesignQueue : activeTab === 'revisions' ? revisionQueue : ceiDrawingQueue;

  const totalDesignKW = [...initialDesignQueue, ...ceiDrawingQueue].reduce((sum, p) => sum + (Number(p.kw_required) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Engineering Studio KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Initial CAD Queue"
          value={initialDesignQueue.length}
          subtext="Surveys completed awaiting CAD"
          icon={Compass}
          iconBg="bg-cyan-50"
          iconColor="text-cyan-600"
          badgeText="Pending"
          badgeColor="bg-cyan-50 text-cyan-700 border-cyan-200"
        />

        <StatCard
          label="Turnaround SLA"
          value="2.4 Days"
          subtext="SLA benchmark: 4.0 days"
          icon={Clock}
          iconBg="bg-[#e8f5e9]"
          iconColor="text-[#16a34a]"
          badgeText="Optimal"
          badgeColor="bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]"
        />

        <StatCard
          label="Revision Requests"
          value={revisionQueue.length}
          subtext="Corrections flagged for review"
          icon={RotateCcw}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          badgeText={revisionQueue.length > 0 ? "Action Req" : "Clear"}
          badgeColor={revisionQueue.length > 0 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]"}
        />

        <StatCard
          label="CEI Statutory Queue"
          value={ceiDrawingQueue.length}
          subtext="CEIG electrical single-line ready"
          icon={FileCheck2}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          badgeText="Statutory"
          badgeColor="bg-purple-50 text-purple-700 border-purple-200"
        />
      </div>

      {/* Filter & View Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <SavedViewsDropdown
            moduleName="design"
            currentFilters={{ activeTab }}
            onApplyView={(filters) => {
              if (filters.activeTab) setActiveTab(filters.activeTab as any);
            }}
            onResetView={() => setActiveTab('initial')}
          />
        </div>
        <ExportCSVButton
          data={currentDataset}
          columns={DESIGN_CSV_COLUMNS}
          filename={`sunfraa-design-queue-${activeTab}.csv`}
        />
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex border-b border-[#e0e2e6] overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('initial')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'initial'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Initial Design Queue ({initialDesignQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('revisions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'revisions'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          <span>Revisions Required ({revisionQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cei')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'cei'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>CEI Drawing Queue ({ceiDrawingQueue.length})</span>
        </button>
      </div>

      {/* TAB 1: Initial Design Queue */}
      {activeTab === 'initial' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6570] font-mono">
              Projects Awaiting Engineering CAD / SLD Drawings ({initialDesignQueue.length})
            </h3>
          </div>

          {initialDesignQueue.length === 0 ? (
            <div className="rounded border border-dashed border-[#d0d4dc] bg-white p-12 text-center text-xs text-[#9297a0] font-mono">
              No projects currently in the initial design queue.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {initialDesignQueue.map((project) => (
                <div
                  key={project.id}
                  className="card-industrial p-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h4 className="font-display text-xs font-bold text-[#181d26] line-clamp-1">
                          {project.client_name}
                        </h4>
                        <span className="text-[10px] font-mono text-[#5f6570]">
                          {project.category.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="rounded bg-[#f0f2f5] px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#181d26] border border-[#e0e2e6]">
                        {project.kw_required} kWp
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-[#5f6570] font-mono">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 shrink-0 text-[#9297a0]" />
                        <span>{project.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3 w-3 shrink-0 text-[#9297a0]" />
                        <span className="truncate">{project.address}</span>
                      </div>
                    </div>

                    {project.site_survey && (
                      <div className="rounded bg-[#fafbfc] p-2.5 text-[11px] text-[#181d26] border border-[#e0e2e6]">
                        <div className="flex items-center justify-between font-semibold">
                          <span>Survey Specs Available:</span>
                          <span className="text-[#5f6570] font-mono text-[10px]">
                            {new Date(project.site_survey.surveyed_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-[#5f6570] text-[10px] mt-0.5">
                          {project.site_survey.physical_measurement}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#f0f2f5] pt-3">
                    <span className="text-[10px] font-mono text-[#5f6570]">Stage: {project.stage}</span>
                    <Link
                      href={`/design/${project.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#aa2d00] hover:text-[#882400]"
                    >
                      Open Studio
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Revisions Required Queue */}
      {activeTab === 'revisions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 font-mono">
              Projects Flagged for Design Revision ({revisionQueue.length})
            </h3>
          </div>

          {revisionQueue.length === 0 ? (
            <div className="rounded border border-dashed border-[#d0d4dc] bg-white p-12 text-center text-xs text-[#9297a0] font-mono">
              No designs currently require revision.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {revisionQueue.map((project) => {
                const flaggedFile = project.design_files?.find((f) => f.status === 'NEEDS_REVISION');
                return (
                  <div
                    key={project.id}
                    className="card-industrial border-rose-200 bg-rose-50/30 p-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h4 className="font-display text-xs font-bold text-[#181d26] line-clamp-1">
                            {project.client_name}
                          </h4>
                          <span className="text-[10px] font-mono text-[#5f6570]">
                            {project.category.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200">
                          Revision Needed
                        </span>
                      </div>

                      {flaggedFile && (
                        <div className="rounded bg-white p-2.5 text-[11px] border border-rose-200">
                          <p className="font-bold text-rose-900 font-mono text-[10px]">
                            {flaggedFile.type} v{flaggedFile.version}
                          </p>
                          <p className="text-[10px] text-rose-700 mt-0.5 italic">
                            &quot;{flaggedFile.revision_comments || 'Corrections requested.'}&quot;
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#f0f2f5] pt-3">
                      <span className="text-[10px] font-semibold text-[#aa2d00]">{project.stage}</span>
                      <Link
                        href={`/design/${project.id}`}
                        className="flex items-center gap-1 text-xs font-bold text-[#aa2d00] hover:underline"
                      >
                        Upload Revised CAD
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CEI Drawing Queue */}
      {activeTab === 'cei' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6570]">
              Projects Awaiting CEI Statutory Drawing Submission ({ceiDrawingQueue.length})
            </h3>
            <span className="text-[11px] text-[#5f6570]">
              Only for &gt;10 kW projects post-execution completion
            </span>
          </div>

          {ceiDrawingQueue.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#e0e2e6] bg-white p-12 text-center text-xs text-[#9297a0]">
              No projects currently in the CEI Drawing Queue.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ceiDrawingQueue.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-col justify-between rounded-lg border border-[#e0e2e6] bg-white p-5 shadow-2xs transition hover:border-purple-400"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h4 className="text-sm font-bold text-[#181d26] line-clamp-1">
                          {project.client_name}
                        </h4>
                        <span className="text-[10px] text-[#5f6570]">
                          {project.category.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                        {project.kw_required} kW
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-[#5f6570]">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span>{project.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{project.address}</span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-purple-50/50 p-2.5 text-[11px] text-purple-900 border border-purple-100">
                      <p className="font-semibold">Statutory CEI Single Line Diagram (SLD) Required</p>
                      <p className="text-[10px] text-purple-600 mt-0.5">
                        Will be referenced by Liaisoning team during CEI portal approval.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#f0f2f5] pt-3">
                    <span className="text-[10px] font-semibold text-purple-700">{project.stage}</span>
                    <Link
                      href={`/design/${project.id}`}
                      className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:underline"
                    >
                      Upload CEI Drawing
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
