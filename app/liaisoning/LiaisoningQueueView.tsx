'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Zap,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Landmark,
  Layers,
  Scale,
} from 'lucide-react';
import { Project, LiaisoningRecord, DiscomFollowUpLog } from '@/types/database';
import ExportCSVButton from '@/components/ExportCSVButton';
import SavedViewsDropdown from '@/components/SavedViewsDropdown';
import { CSVColumn } from '@/lib/csvExport';

interface LiaisoningQueueViewProps {
  projects: (Project & {
    liaisoning_record?: (LiaisoningRecord & { follow_up_logs?: DiscomFollowUpLog[] }) | null;
  })[];
}

const LIAISONING_CSV_COLUMNS: CSVColumn<Project & { liaisoning_record?: (LiaisoningRecord & { follow_up_logs?: DiscomFollowUpLog[] }) | null }>[] = [
  { header: 'Client Name', accessor: 'client_name' },
  { header: 'Phone', accessor: 'phone' },
  { header: 'Connection #', accessor: (p) => p.connection_number ?? '' },
  { header: 'Address', accessor: 'address' },
  { header: 'Category', accessor: 'category' },
  { header: 'kW Required', accessor: 'kw_required' },
  { header: 'Stage', accessor: 'stage' },
  { header: 'Govt Estimate (₹)', accessor: (p) => p.liaisoning_record?.govt_estimate_amount ?? '' },
  { header: 'Estimate Status', accessor: (p) => p.liaisoning_record?.estimate_paid_at ? 'Paid' : 'Unpaid' },
  { header: 'Connected Date', accessor: (p) => p.liaisoning_record?.connected_at ? new Date(p.liaisoning_record.connected_at).toLocaleDateString() : '' },
];

export default function LiaisoningQueueView({ projects }: LiaisoningQueueViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONNECTED' | 'IN_PROGRESS'>('ALL');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      (p.connection_number && p.connection_number.includes(searchQuery));

    const isConnected = p.stage === 'CONNECTED' || Boolean(p.liaisoning_record?.connected_at);
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'CONNECTED' && isConnected) ||
      (statusFilter === 'IN_PROGRESS' && !isConnected);

    return matchesSearch && matchesStatus;
  });

  const inProgressCount = filteredProjects.filter((p) => p.stage !== 'CONNECTED' && !p.liaisoning_record?.connected_at).length;
  const connectedCount = filteredProjects.filter((p) => p.stage === 'CONNECTED' || Boolean(p.liaisoning_record?.connected_at)).length;
  const ceiCount = filteredProjects.filter((p) => p.cei_required).length;

  // Calculate 7-day DISCOM follow-up nudge
  const getFollowUpStatus = (record?: (LiaisoningRecord & { follow_up_logs?: DiscomFollowUpLog[] }) | null) => {
    if (!record || !record.follow_up_logs || record.follow_up_logs.length === 0) {
      return { needsNudge: true, label: 'No follow-up logged yet' };
    }

    const lastLog = record.follow_up_logs[0];
    const lastDate = new Date(lastLog.follow_up_date);
    const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 7) {
      return { needsNudge: true, label: `${diffDays}d overdue` };
    }
    return { needsNudge: false, label: `Followed up ${diffDays}d ago` };
  };

  return (
    <div className="space-y-6">
      {/* Top Statutory KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card-industrial p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#5f6570] uppercase">Active Applications</span>
            <Landmark className="h-3.5 w-3.5 text-[#aa2d00]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-xl font-bold text-[#181d26]">{inProgressCount}</span>
            <span className="text-[10px] font-mono text-[#5f6570]">DISCOM active</span>
          </div>
        </div>

        <div className="card-industrial p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#5f6570] uppercase">Grid Connected</span>
            <span className="text-[9px] font-mono font-bold text-[#15803d] bg-[#e8f5e9] px-1 rounded border border-[#a8d8c4]">100% Sync</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-xl font-bold text-[#15803d]">{connectedCount}</span>
            <span className="text-[10px] font-mono text-[#5f6570]">meters energized</span>
          </div>
        </div>

        <div className="card-industrial p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#5f6570] uppercase">CEIG Inspections</span>
            <Scale className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-xl font-bold text-purple-700">{ceiCount}</span>
            <span className="text-[10px] font-mono text-[#5f6570]">&gt;10 kW files</span>
          </div>
        </div>

        <div className="card-industrial p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#5f6570] uppercase">7-Day SLA Nudges</span>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-xl font-bold text-amber-600">3</span>
            <span className="text-[10px] font-mono text-[#5f6570]">follow-ups due</span>
          </div>
        </div>
      </div>

      {/* Industrial Search and Filters */}
      <div className="flex flex-col gap-3 rounded border border-[#e2e8f0] bg-white p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Saved Views */}
          <SavedViewsDropdown
            moduleName="liaisoning"
            currentFilters={{ searchQuery, statusFilter }}
            onApplyView={(filters) => {
              if (filters.searchQuery !== undefined) setSearchQuery(filters.searchQuery);
              if (filters.statusFilter !== undefined) setStatusFilter(filters.statusFilter);
            }}
            onResetView={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
          />

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9297a0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client, phone, connection #..."
              className="h-8 w-64 rounded border border-[#d0d4dc] bg-white pl-8 pr-2.5 text-xs text-[#181d26] placeholder:text-[#9297a0] focus:border-[#181d26] focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-8 rounded border border-[#d0d4dc] bg-white px-2.5 text-xs font-medium text-[#333840] focus:border-[#181d26] focus:outline-none"
          >
            <option value="ALL">All Liaisoning Statuses</option>
            <option value="IN_PROGRESS">Liaisoning In Progress</option>
            <option value="CONNECTED">Grid Connected</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <ExportCSVButton
            filename="liaisoning_records"
            columns={LIAISONING_CSV_COLUMNS}
            data={filteredProjects}
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded border border-dashed border-[#d0d4dc] bg-white p-12 text-center text-xs text-[#9297a0] font-mono">
          No projects currently in liaisoning queue. Projects appear here automatically once payment is collected (Business Rule 12).
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const lRecord = project.liaisoning_record;
            const followUp = getFollowUpStatus(lRecord);
            const isConnected = project.stage === 'CONNECTED' || Boolean(lRecord?.connected_at);

            return (
              <div
                key={project.id}
                className="card-industrial p-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <h3 className="font-display text-xs font-bold text-[#181d26] line-clamp-1">
                        {project.client_name}
                      </h3>
                      <span className="text-[10px] font-mono text-[#5f6570]">
                        {project.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded bg-[#f0f2f5] px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#181d26] border border-[#e0e2e6]">
                        {project.kw_required} kWp
                      </span>
                      {project.cei_required && (
                        <span className="rounded px-1 py-0.2 text-[8px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200">
                          CEI &gt;10kW
                        </span>
                      )}
                    </div>
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

                  {/* Statutory & DISCOM Status Pills */}
                  <div className="rounded bg-[#fafbfc] p-2.5 text-[11px] text-[#333840] border border-[#e0e2e6] space-y-1.5 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5f6570] text-[10px]">DISCOM Reg:</span>
                      <span className="font-bold text-[#181d26] text-[10px]">
                        {project.connection_number || 'Pending'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#5f6570] text-[10px]">Statutory Estimate:</span>
                      {lRecord?.estimate_paid_at ? (
                        <span className="font-semibold text-[#15803d] text-[10px]">✓ Paid (₹{lRecord.govt_estimate_amount || 0})</span>
                      ) : lRecord?.govt_estimate_amount ? (
                        <span className="font-semibold text-amber-600 text-[10px]">Generated (₹{lRecord.govt_estimate_amount})</span>
                      ) : (
                        <span className="text-[#9297a0] text-[10px]">Not Generated</span>
                      )}
                    </div>

                    {/* 7-Day Follow-Up Nudge Indicator */}
                    {!isConnected && (
                      <div className="flex items-center justify-between border-t border-[#e0e2e6] pt-1 text-[10px]">
                        <span className="text-[#5f6570]">7-Day Nudge:</span>
                        {followUp.needsNudge ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                            <AlertTriangle className="h-3 w-3" />
                            {followUp.label}
                          </span>
                        ) : (
                          <span className="text-[#15803d] font-medium">{followUp.label}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#f0f2f5] pt-3">
                  <div>
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#15803d] bg-[#e8f5e9] border border-[#a8d8c4]">
                        <CheckCircle2 className="h-3 w-3" />
                        CONNECTED
                      </span>
                    ) : (
                      <span className="rounded bg-[#fafbfc] px-1.5 py-0.5 text-[10px] font-mono text-[#41454d] border border-[#e0e2e6]">
                        {project.stage}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/liaisoning/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#aa2d00] hover:text-[#882400]"
                  >
                    Open Workspace
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
