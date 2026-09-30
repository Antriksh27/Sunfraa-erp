'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  generateDefaultMilestonesAction,
  updateMilestonesAction,
  collectMilestonePaymentAction,
  recordDirectPaymentAction,
  createInvoiceAction,
} from '@/app/accounts/actions';
import {
  CreditCard,
  Search,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
  Check,
  Plus,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Project,
  ProjectCategory,
  ProjectStage,
  PaymentStatus,
  PaymentMilestone,
  Invoice,
  PaymentMode,
  InvoiceType,
} from '@/types/database';
import ExportCSVButton from '@/components/ExportCSVButton';
import SavedViewsDropdown from '@/components/SavedViewsDropdown';
import AgingReceivablesReport from '@/components/AgingReceivablesReport';
import InvoiceModal from '@/components/InvoiceModal';
import { CSVColumn } from '@/lib/csvExport';

import StatCard from '@/components/StatCard';

interface AccountsDashboardViewProps {
  projects: (Project & { lead_owner?: { name: string } | null; payment_collected_by?: { name: string } | null })[];
  milestones: PaymentMilestone[];
  invoices: Invoice[];
  isAuthorized: boolean;
}

const ACCOUNTS_CSV_COLUMNS: CSVColumn<Project & { lead_owner?: { name: string } | null; payment_collected_by?: { name: string } | null }>[] = [
  { header: 'Client Name', accessor: 'client_name' },
  { header: 'Phone', accessor: 'phone' },
  { header: 'Address', accessor: 'address' },
  { header: 'Category', accessor: 'category' },
  { header: 'kW Required', accessor: 'kw_required' },
  { header: 'Stage', accessor: 'stage' },
  { header: 'Quotation Amount', accessor: (p) => p.quotation_amount ?? '' },
  { header: 'Payment Status', accessor: 'payment_status' },
  { header: 'Lead Owner', accessor: (p) => p.lead_owner?.name ?? '' },
];

export default function AccountsDashboardView({
  projects,
  milestones = [],
  invoices = [],
  isAuthorized,
}: AccountsDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'milestones' | 'aging' | 'invoices'>('milestones');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PENDING' | 'PARTIAL' | 'COLLECTED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Milestone expansion state
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const highlightParam = searchParams ? searchParams.get('highlight') : null;

  useEffect(() => {
    if (highlightParam) {
      setExpandedProjectId(highlightParam);
      const timer = setTimeout(() => {
        const el = document.getElementById(`project-row-${highlightParam}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [highlightParam]);

  // Modals state
  const [recordingPaymentFor, setRecordingPaymentFor] = useState<{
    project: Project;
    milestone?: PaymentMilestone | null;
  } | null>(null);
  const [selectedMilestoneOption, setSelectedMilestoneOption] = useState<string>('FULL');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('NEFT');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  const [configuringMilestonesFor, setConfiguringMilestonesFor] = useState<Project | null>(null);
  const [draftMilestones, setDraftMilestones] = useState<Array<{ milestone_name: string; percentage: number; amount: number; due_date?: string }>>([]);

  const [creatingInvoiceFor, setCreatingInvoiceFor] = useState<Project | null>(null);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('TAX');
  const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(13.8);

  const [viewingInvoice, setViewingInvoice] = useState<{ invoice: Invoice; project: Project } | null>(null);

  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Map milestones by project_id
  const milestonesByProject = new Map<string, PaymentMilestone[]>();
  milestones.forEach((m) => {
    const list = milestonesByProject.get(m.project_id) || [];
    list.push(m);
    milestonesByProject.set(m.project_id, list);
  });

  // Calculate high-level financial metrics
  const totalQuotationPipeline = projects.reduce((acc, p) => acc + (Number(p.quotation_amount) || 0), 0);
  const totalCollectedMilestones = projects.reduce((acc, p) => {
    const projMilestones = milestonesByProject.get(p.id) || [];
    const milestoneSum = projMilestones
      .filter((m) => m.status === 'COLLECTED')
      .reduce((sum, m) => sum + Number(m.amount), 0);
    const quote = Number(p.quotation_amount) || 0;
    if (p.payment_status === 'COLLECTED') {
      return acc + (milestoneSum > 0 ? milestoneSum : quote);
    }
    return acc + milestoneSum;
  }, 0);
  const totalPendingMilestones = Math.max(0, totalQuotationPipeline - totalCollectedMilestones);

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPayment =
      paymentFilter === 'ALL' || p.payment_status === paymentFilter;

    const matchesCategory =
      categoryFilter === 'ALL' || p.category === categoryFilter;

    return matchesSearch && matchesPayment && matchesCategory;
  });

  // Actions
  async function handleAutoSplit(project: Project) {
    setLoading(true);
    setActionError(null);
    const res = await generateDefaultMilestonesAction(project.id);
    if (res?.error) setActionError(res.error);
    setLoading(false);
  }

  function handleOpenRecordPayment(project: Project, milestone?: PaymentMilestone | null) {
    const projMilestones = milestonesByProject.get(project.id) || [];
    const pendingMilestones = projMilestones.filter((m) => m.status === 'PENDING');
    const totalCollected = projMilestones
      .filter((m) => m.status === 'COLLECTED')
      .reduce((sum, m) => sum + Number(m.amount), 0);
    const totalQuote = Number(project.quotation_amount) || 0;
    const remaining = Math.max(0, totalQuote - totalCollected);

    setRecordingPaymentFor({ project, milestone: milestone || null });
    if (milestone) {
      setSelectedMilestoneOption(milestone.id);
      setPaymentAmount(Number(milestone.amount) || 0);
    } else if (pendingMilestones.length > 0) {
      setSelectedMilestoneOption(pendingMilestones[0].id);
      setPaymentAmount(Number(pendingMilestones[0].amount) || 0);
    } else {
      setSelectedMilestoneOption('FULL');
      setPaymentAmount(remaining > 0 ? remaining : totalQuote);
    }
    setPaymentMode('NEFT');
    setReferenceNumber('');
    setReceiptUrl('');
    setActionError(null);
  }

  function handleOpenConfigureMilestones(project: Project) {
    const existing = milestonesByProject.get(project.id) || [];
    const quote = Number(project.quotation_amount) || 0;

    if (existing.length > 0) {
      setDraftMilestones(
        existing.map((m) => ({
          milestone_name: m.milestone_name,
          percentage: m.percentage,
          amount: m.amount,
          due_date: m.due_date || undefined,
        }))
      );
    } else {
      setDraftMilestones([
        { milestone_name: '10% Advance Token / Booking', percentage: 10, amount: Math.round(quote * 0.1) },
        { milestone_name: '60% Material Dispatch from Store', percentage: 60, amount: Math.round(quote * 0.6) },
        { milestone_name: '20% Structure & Panel Installation', percentage: 20, amount: Math.round(quote * 0.2) },
        { milestone_name: '10% Grid Synchronization & Net Metering', percentage: 10, amount: Math.round(quote * 0.1) },
      ]);
    }
    setConfiguringMilestonesFor(project);
  }

  async function handleSaveMilestoneSplit(e: React.FormEvent) {
    e.preventDefault();
    if (!configuringMilestonesFor) return;

    setLoading(true);
    setActionError(null);
    const res = await updateMilestonesAction(configuringMilestonesFor.id, draftMilestones);
    if (res?.error) {
      setActionError(res.error);
    } else {
      setConfiguringMilestonesFor(null);
    }
    setLoading(false);
  }

  async function handleConfirmRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!recordingPaymentFor) return;

    setLoading(true);
    setActionError(null);

    const isSpecificMilestone =
      selectedMilestoneOption &&
      selectedMilestoneOption !== 'FULL' &&
      selectedMilestoneOption !== 'CUSTOM';

    const res = await recordDirectPaymentAction(
      recordingPaymentFor.project.id,
      paymentAmount,
      paymentMode,
      referenceNumber,
      isSpecificMilestone ? selectedMilestoneOption : null,
      receiptUrl
    );

    if (res?.error) {
      setActionError(res.error);
    } else {
      setRecordingPaymentFor(null);
      setReferenceNumber('');
      setReceiptUrl('');
    }
    setLoading(false);
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!creatingInvoiceFor) return;

    setLoading(true);
    setActionError(null);
    const res = await createInvoiceAction(creatingInvoiceFor.id, invoiceType, invoiceAmount, gstRate);
    if (res?.error) {
      setActionError(res.error);
    } else {
      setCreatingInvoiceFor(null);
      if (res.invoice) {
        setViewingInvoice({ invoice: res.invoice, project: creatingInvoiceFor });
      }
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* 3 Overview KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Revenue Collected"
          value={`₹${totalCollectedMilestones.toLocaleString('en-IN')}`}
          subtext={`${milestones.filter((m) => m.status === 'COLLECTED').length} verified milestone collections`}
          icon={CheckCircle2}
          iconBg="bg-[#e8f5e9]"
          iconColor="text-[#16a34a]"
          badgeText="Verified"
          badgeColor="bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]"
        />

        <StatCard
          label="Outstanding Receivables"
          value={`₹${totalPendingMilestones.toLocaleString('en-IN')}`}
          subtext={`${milestones.filter((m) => m.status === 'PENDING').length} pending milestone billings`}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          badgeText="Pending"
          badgeColor="bg-amber-50 text-amber-700 border-amber-200"
        />

        <StatCard
          label="Total Active Pipeline"
          value={`₹${totalQuotationPipeline.toLocaleString('en-IN')}`}
          subtext={`${projects.length} quoted commercial & residential deals`}
          icon={DollarSign}
          iconBg="bg-[#fff0eb]"
          iconColor="text-[#aa2d00]"
          badgeText="Pipeline"
          badgeColor="bg-[#fff0eb] text-[#aa2d00] border-[#fcab79]"
        />
      </div>

      {actionError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Navigation Tab Bar */}
      <div className="flex border-b border-[#e0e2e6] overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'milestones'
              ? 'border-[#16a34a] text-[#15803d]'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Receivables & Milestone Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('aging')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'aging'
              ? 'border-[#16a34a] text-[#15803d]'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Aging Receivables Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'border-[#16a34a] text-[#15803d]'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Tax Invoices & GST ({invoices.length})</span>
        </button>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === 'milestones' && (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#9297a0]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter client, phone..."
                  className="h-9 w-60 rounded-lg border border-[#e0e2e6] bg-white pl-9 pr-3 text-sm text-[#181d26] placeholder:text-[#9297a0] focus:border-[#16a34a] focus:outline-none shadow-2xs"
                />
              </div>

              {/* Status Filter */}
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="h-9 rounded-lg border border-[#e0e2e6] bg-white px-3 text-sm font-medium text-[#333840] focus:border-[#16a34a] focus:outline-none shadow-2xs"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PENDING">Pending (0%)</option>
                <option value="PARTIAL">Partial (1–99%)</option>
                <option value="COLLECTED">Collected (100%)</option>
              </select>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ExportCSVButton
            filename="accounts_receivables"
            columns={ACCOUNTS_CSV_COLUMNS}
            data={filteredProjects}
          />
        </div>
      </div>

      {/* Tab 1: Receivables & Milestones Table */}
      {activeTab === 'milestones' && (
        <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e0e2e6] bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570]">
                <tr>
                  <th className="p-3">Project & Client</th>
                  <th className="p-3">Quotation Value</th>
                  <th className="p-3">Milestone Progress</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5]">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-[#5f6570]">
                      <CreditCard className="mx-auto h-8 w-8 text-[#d0d4dc] mb-2" />
                      <p className="font-semibold text-[#181d26]">No Receivables Found</p>
                      <p className="text-[11px] text-[#5f6570] mt-1">
                        {searchQuery || paymentFilter !== 'ALL'
                          ? 'No project receivables match your search query or status filter.'
                          : 'No project billing schedules have been initiated yet.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p) => {
                  const projMilestones = milestonesByProject.get(p.id) || [];
                  const milestoneCollected = projMilestones
                    .filter((m) => m.status === 'COLLECTED')
                    .reduce((sum, m) => sum + Number(m.amount), 0);
                  const totalQuote = Number(p.quotation_amount) || 0;

                  const isCollected = p.payment_status === 'COLLECTED';
                  const totalCollected = isCollected
                    ? (milestoneCollected > 0 ? milestoneCollected : totalQuote)
                    : milestoneCollected;

                  const rawPct = totalQuote > 0 ? (totalCollected / totalQuote) * 100 : 0;
                  const percentDisplay = isCollected
                    ? '100%'
                    : totalCollected > 0
                    ? rawPct >= 1
                      ? `${Math.round(rawPct)}%`
                      : `${rawPct.toFixed(1)}%`
                    : '0%';
                  const progressWidth = isCollected ? 100 : Math.min(100, Math.max(totalCollected > 0 ? 2 : 0, rawPct));
                  const isExpanded = expandedProjectId === p.id;

                  const isHighlighted = highlightParam === p.id;

                  return (
                    <tr
                      key={p.id}
                      id={`project-row-${p.id}`}
                      className={`transition-colors ${
                        isHighlighted
                          ? 'bg-amber-50/80 ring-2 ring-amber-400'
                          : 'hover:bg-[#f8fafc]/50'
                      }`}
                    >
                      <td className="p-3 align-top">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedProjectId(isExpanded ? null : p.id)}
                            className="text-[#9297a0] hover:text-[#181d26]"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setExpandedProjectId(isExpanded ? null : p.id)}
                                className="font-bold text-[#181d26] hover:underline text-left"
                              >
                                {p.client_name}
                              </button>
                              {isHighlighted && (
                                <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-900 uppercase tracking-wider">
                                  Highlighted
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#5f6570]">
                              {p.phone} • {p.kw_required} kW ({p.category.replace(/_/g, ' ')})
                            </p>
                          </div>
                        </div>

                        {/* Expandable Milestones Accordion */}
                        {isExpanded && (
                          <div className="mt-3 ml-6 space-y-2 rounded-lg border border-[#e0e2e6] bg-[#fafbfc] p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[#181d26]">
                                Payment Milestone Schedule ({projMilestones.length})
                              </span>
                              {isAuthorized && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenConfigureMilestones(p)}
                                  className="text-[10px] font-semibold text-[#aa2d00] hover:underline"
                                >
                                  Configure / Edit Split
                                </button>
                              )}
                            </div>

                            {projMilestones.length === 0 ? (
                              <div className="py-2 text-[11px] text-[#5f6570] space-y-2">
                                <p>No milestone schedule generated yet.</p>
                                {isAuthorized && (
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRecordPayment(p)}
                                      className="inline-flex items-center gap-1 rounded bg-[#15803d] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#0a2e0e] shadow-2xs transition-colors"
                                    >
                                      <CreditCard className="h-3 w-3" />
                                      Record Direct Payment
                                    </button>
                                    {totalQuote > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleAutoSplit(p)}
                                        className="font-semibold text-[#aa2d00] hover:underline text-[11px]"
                                      >
                                        or Generate 10/60/20/10 Split
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="divide-y divide-[#e0e2e6] text-xs">
                                {projMilestones.map((m) => (
                                  <div key={m.id} className="py-2 flex items-center justify-between gap-2">
                                    <div>
                                      <span className="font-medium text-[#181d26]">{m.milestone_name}</span>
                                      <p className="text-[10px] text-[#5f6570]">
                                        ₹{Number(m.amount).toLocaleString('en-IN')} ({m.percentage}%)
                                        {m.collected_at && ` • Paid on ${new Date(m.collected_at).toLocaleDateString()} via ${m.payment_mode} (Ref: ${m.reference_number})`}
                                      </p>
                                    </div>

                                    <div>
                                      {m.status === 'COLLECTED' ? (
                                        <span className="inline-flex items-center gap-1 rounded bg-[#e8f5e9] px-2 py-0.5 text-[10px] font-semibold text-[#0a2e0e]">
                                          <Check className="h-3 w-3 text-[#16a34a]" />
                                          Collected
                                        </span>
                                      ) : isAuthorized ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenRecordPayment(p, m)}
                                          className="rounded bg-[#15803d] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#0a2e0e] shadow-2xs transition-colors"
                                        >
                                          Record Payment
                                        </button>
                                      ) : (
                                        <span className="rounded bg-[#f0f2f5] px-2 py-0.5 text-[10px] text-[#41454d]">
                                          Pending
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-3 align-top font-bold text-[#181d26]">
                        ₹{totalQuote > 0 ? totalQuote.toLocaleString('en-IN') : 'Quote Not Set'}
                      </td>

                      <td className="p-3 align-top">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-medium text-[#5f6570]">
                            <span>Collected: ₹{totalCollected.toLocaleString('en-IN')}</span>
                            <span>{percentDisplay}</span>
                          </div>
                          <div className="h-1.5 w-36 overflow-hidden rounded-full bg-[#f0f2f5]">
                            <div
                              className={`h-full ${isCollected ? 'bg-[#16a34a]' : 'bg-[#aa2d00]'}`}
                              style={{ width: `${progressWidth}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-3 align-top">
                        {p.payment_status === 'COLLECTED' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2.5 py-0.5 text-[11px] font-bold text-[#0a2e0e] border border-[#a8d8c4]">
                            <CheckCircle2 className="h-3 w-3 text-[#16a34a]" />
                            Collected (100%)
                          </span>
                        ) : p.payment_status === 'PARTIAL' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0eb] px-2.5 py-0.5 text-[11px] font-bold text-[#aa2d00] border border-[#fcab79]">
                            Partial ({percentDisplay})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                            Pending (0%)
                          </span>
                        )}
                      </td>

                      <td className="p-3 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAuthorized && p.payment_status !== 'COLLECTED' && (
                            <button
                              type="button"
                              onClick={() => handleOpenRecordPayment(p)}
                              className="inline-flex items-center gap-1 rounded bg-[#15803d] px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-[#0a2e0e] transition-colors whitespace-nowrap"
                            >
                              <CreditCard className="h-3 w-3" />
                              Record Payment
                            </button>
                          )}
                          {isAuthorized && (
                            <button
                              type="button"
                              onClick={() => {
                                setCreatingInvoiceFor(p);
                                setInvoiceAmount(Number(p.quotation_amount) || 0);
                              }}
                              className="rounded border border-[#e0e2e6] bg-white px-2.5 py-1 text-xs font-semibold text-[#181d26] hover:bg-[#f8fafc] transition-colors whitespace-nowrap"
                            >
                              + Invoice
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Aging Receivables Report */}
      {activeTab === 'aging' && (
        <AgingReceivablesReport
          projects={projects}
          milestones={milestones}
          onRecordPayment={(milestone, project) => handleOpenRecordPayment(project, milestone)}
        />
      )}

      {/* Tab 3: Invoicing Center */}
      {activeTab === 'invoices' && (
        <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#f0f2f5] bg-[#fafbfc] px-5 py-3">
            <h3 className="text-xs font-bold text-[#181d26]">Generated Tax Invoices ({invoices.length})</h3>
          </div>

          {invoices.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#9297a0]">
              <FileText className="mx-auto h-6 w-6 text-[#9297a0] mb-2" />
              <p className="font-semibold text-[#181d26]">No invoices created yet</p>
              <p className="text-[11px] mt-0.5">Click &quot;+ Invoice&quot; on any project in the Receivables tab to issue a Tax Invoice.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#e0e2e6] bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570]">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Taxable (₹)</th>
                    <th className="p-3 text-right">GST ({gstRate}%)</th>
                    <th className="p-3 text-right">Total Amount (₹)</th>
                    <th className="p-3">Issued Date</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2f5]">
                  {invoices.map((inv) => {
                    const matchedProj = projects.find((p) => p.id === inv.project_id);
                    return (
                      <tr key={inv.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-[#181d26]">{inv.invoice_number}</p>
                          <p className="text-[10px] text-[#5f6570]">{matchedProj?.client_name || 'Project'}</p>
                        </td>
                        <td className="p-3">
                          <span className="rounded bg-[#f0f2f5] px-2 py-0.5 text-[10px] font-bold text-[#181d26]">
                            {inv.invoice_type}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-[#181d26]">
                          ₹{Number(inv.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right text-[#5f6570]">
                          ₹{Number(inv.gst_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-bold text-[#181d26]">
                          ₹{Number(inv.total_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-[#5f6570]">
                          {new Date(inv.issued_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (matchedProj) {
                                setViewingInvoice({ invoice: inv, project: matchedProj });
                              }
                            }}
                            className="flex items-center gap-1 ml-auto rounded bg-[#181d26] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0d1218]"
                          >
                            <Printer className="h-3 w-3" />
                            View / Print
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      {recordingPaymentFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#181d26]">Record Payment Collection</h3>
                <p className="text-[11px] text-[#5f6570]">
                  {recordingPaymentFor.project.client_name} • {recordingPaymentFor.project.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecordingPaymentFor(null)}
                className="text-[#9297a0] hover:text-[#181d26]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRecordPayment} className="space-y-3.5 text-xs">
              {/* Milestone / Allocation Selector */}
              {(() => {
                const projMilestones = (milestonesByProject.get(recordingPaymentFor.project.id) || []).filter(
                  (m) => m.status === 'PENDING'
                );

                if (projMilestones.length > 0) {
                  return (
                    <div>
                      <label className="block font-semibold text-[#181d26] mb-1">Payment Allocation / Milestone</label>
                      <select
                        value={selectedMilestoneOption}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedMilestoneOption(val);
                          if (val === 'FULL') {
                            const totalCollected = (milestonesByProject.get(recordingPaymentFor.project.id) || [])
                              .filter((m) => m.status === 'COLLECTED')
                              .reduce((sum, m) => sum + Number(m.amount), 0);
                            const totalQuote = Number(recordingPaymentFor.project.quotation_amount) || 0;
                            setPaymentAmount(Math.max(0, totalQuote - totalCollected));
                          } else if (val === 'CUSTOM') {
                            // keep custom
                          } else {
                            const matched = projMilestones.find((m) => m.id === val);
                            if (matched) setPaymentAmount(Number(matched.amount) || 0);
                          }
                        }}
                        className="h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs text-[#181d26] bg-white font-medium"
                      >
                        {projMilestones.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.milestone_name} — ₹{Number(m.amount).toLocaleString('en-IN')} ({m.percentage}%)
                          </option>
                        ))}
                        <option value="FULL">Collect Full Remaining Project Balance</option>
                        <option value="CUSTOM">Custom Payment Amount</option>
                      </select>
                    </div>
                  );
                }

                return null;
              })()}

              {/* Amount Input */}
              <div>
                <label className="block font-semibold text-[#181d26]">Amount to Collect (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 50000"
                  className="mt-1 h-9 block w-full rounded border border-[#e0e2e6] px-3 text-sm font-bold text-[#181d26] focus:border-[#16a34a] focus:outline-none"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block font-semibold text-[#181d26]">Payment Mode <span className="text-red-500">*</span></label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs text-[#181d26] bg-white"
                >
                  <option value="NEFT">NEFT / RTGS Bank Transfer</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash Collection</option>
                </select>
              </div>

              {/* UTR / Reference Number */}
              <div>
                <label className="block font-semibold text-[#181d26]">
                  UTR / Reference / Cheque # <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UTR8912739182 / CHQ-091283"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs text-[#181d26] focus:border-[#16a34a] focus:outline-none"
                />
              </div>

              {/* Receipt URL */}
              <div>
                <label className="block font-semibold text-[#181d26]">Receipt / Bank Screenshot URL (Optional)</label>
                <input
                  type="url"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs text-[#181d26] focus:border-[#16a34a] focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e0e2e6]">
                <button
                  type="button"
                  onClick={() => setRecordingPaymentFor(null)}
                  className="rounded px-3 py-1.5 font-medium text-[#5f6570] hover:text-[#181d26]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !referenceNumber.trim() || paymentAmount <= 0}
                  className="flex items-center gap-1.5 rounded-lg bg-[#15803d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0a2e0e] disabled:opacity-50 shadow-2xs transition-colors"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Confirm Payment Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure Milestones Modal */}
      {configuringMilestonesFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#181d26]">Configure Milestone Split</h3>
                <p className="text-[11px] text-[#5f6570]">
                  {configuringMilestonesFor.client_name} • Quotation: ₹{Number(configuringMilestonesFor.quotation_amount).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfiguringMilestonesFor(null)}
                className="text-[#9297a0] hover:text-[#181d26]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMilestoneSplit} className="space-y-3 text-xs">
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {draftMilestones.map((dm, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded border border-[#e0e2e6] p-2 bg-[#fafbfc]">
                    <input
                      type="text"
                      required
                      value={dm.milestone_name}
                      onChange={(e) => {
                        const updated = [...draftMilestones];
                        updated[idx].milestone_name = e.target.value;
                        setDraftMilestones(updated);
                      }}
                      className="h-7 flex-1 rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26]"
                    />
                    <div className="relative w-16">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={dm.percentage}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const quote = Number(configuringMilestonesFor.quotation_amount) || 0;
                          const updated = [...draftMilestones];
                          updated[idx].percentage = val;
                          updated[idx].amount = Math.round((quote * val) / 100);
                          setDraftMilestones(updated);
                        }}
                        className="h-7 w-full rounded border border-[#e0e2e6] bg-white px-1 text-xs text-[#181d26]"
                      />
                      <span className="pointer-events-none absolute right-1.5 top-1.5 text-[10px] text-[#9297a0]">%</span>
                    </div>
                    <span className="w-24 text-right font-bold text-[#181d26]">
                      ₹{dm.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 font-semibold text-[#181d26]">
                <span>Total Split:</span>
                <span className={draftMilestones.reduce((s, m) => s + m.percentage, 0) === 100 ? 'text-[#16a34a]' : 'text-[#aa2d00]'}>
                  {draftMilestones.reduce((s, m) => s + m.percentage, 0)}% of 100%
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e0e2e6]">
                <button
                  type="button"
                  onClick={() => setConfiguringMilestonesFor(null)}
                  className="rounded px-3 py-1.5 font-medium text-[#5f6570] hover:text-[#181d26]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || draftMilestones.reduce((s, m) => s + m.percentage, 0) !== 100}
                  className="rounded bg-[#181d26] px-4 py-1.5 font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
                >
                  Save Split Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {creatingInvoiceFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#181d26]">Issue Tax Invoice</h3>
                <p className="text-[11px] text-[#5f6570]">{creatingInvoiceFor.client_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setCreatingInvoiceFor(null)}
                className="text-[#9297a0] hover:text-[#181d26]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#181d26]">Invoice Type</label>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value as InvoiceType)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs text-[#181d26]"
                >
                  <option value="TAX">Tax Invoice</option>
                  <option value="ADVANCE">Advance Receipt Invoice</option>
                  <option value="FINAL">Final Commissioning Invoice</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#181d26]">Taxable Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(parseFloat(e.target.value) || 0)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs text-[#181d26]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#181d26]">GST Rate (%)</label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(parseFloat(e.target.value) || 13.8)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs text-[#181d26]"
                >
                  <option value="13.8">13.8% (Composite Rooftop Solar GST)</option>
                  <option value="18.0">18.0% (Standard Commercial Service GST)</option>
                  <option value="12.0">12.0% (Solar Inverter & BOS)</option>
                </select>
              </div>

              <div className="rounded bg-[#fafbfc] p-3 space-y-1 text-[11px] border border-[#f0f2f5]">
                <div className="flex justify-between text-[#5f6570]">
                  <span>GST Amount:</span>
                  <span>₹{(Math.round(((invoiceAmount * gstRate) / 100) * 100) / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-[#181d26]">
                  <span>Total Payable:</span>
                  <span>₹{(invoiceAmount + Math.round(((invoiceAmount * gstRate) / 100) * 100) / 100).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e0e2e6]">
                <button
                  type="button"
                  onClick={() => setCreatingInvoiceFor(null)}
                  className="rounded px-3 py-1.5 font-medium text-[#5f6570] hover:text-[#181d26]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || invoiceAmount <= 0}
                  className="rounded bg-[#181d26] px-4 py-1.5 font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
                >
                  Generate & View Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal Popup */}
      {viewingInvoice && (
        <InvoiceModal
          invoice={viewingInvoice.invoice}
          project={viewingInvoice.project}
          onClose={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
}
