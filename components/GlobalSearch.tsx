'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, ArrowRight, X, Phone, MapPin, Zap } from 'lucide-react';
import { SearchProjectResult, searchProjectsAction } from '@/app/actions/search';
import { ProjectStage, UserRole } from '@/types/database';
import { getProjectUrlForRole } from '@/lib/navigation';

const STAGE_LABELS: Partial<Record<ProjectStage, { label: string; badgeClass: string }>> = {
  LEAD: { label: 'Lead', badgeClass: 'bg-[#fef8e7] text-[#855900] border-[#f4d35e]' },
  SITE_SURVEY_SCHEDULED: { label: 'Survey Scheduled', badgeClass: 'bg-[#f0f9ff] text-[#0369a1] border-[#bae6fd]' },
  SITE_SURVEY_DONE: { label: 'Survey Done', badgeClass: 'bg-[#eef9f5] text-[#0a2e0e] border-[#a8d8c4]' },
  DESIGN_PENDING: { label: 'Design Pending', badgeClass: 'bg-[#fff5ee] text-[#7c2d12] border-[#fcab79]' },
  DESIGN_UPLOADED: { label: 'Design Ready', badgeClass: 'bg-[#fff5ee] text-[#7c2d12] border-[#fcab79]' },
  QUOTATION_SENT: { label: 'Quotation Sent', badgeClass: 'bg-[#fefce8] text-[#854d0e] border-[#fef08a]' },
  STALE: { label: 'Stale', badgeClass: 'bg-[#fff0eb] text-[#aa2d00] border-[#fcab79]' },
  PAYMENT_COLLECTED: { label: 'Payment Collected', badgeClass: 'bg-[#e8f5e9] text-[#0a2e0e] border-[#39bf45]' },
  DIRECTOR_APPROVED: { label: 'Director Approved', badgeClass: 'bg-[#faf5ff] text-[#581c87] border-[#d8b4fe]' },
  EXECUTION_IN_PROGRESS: { label: 'In Execution', badgeClass: 'bg-[#eff6ff] text-[#1e3a8a] border-[#bfdbfe]' },
  LIAISONING_IN_PROGRESS: { label: 'Liaisoning', badgeClass: 'bg-[#eef2ff] text-[#3730a3] border-[#c7d2fe]' },
  CEI_IN_PROGRESS: { label: 'CEI Approval', badgeClass: 'bg-[#f5f3ff] text-[#5b21b6] border-[#ddd6fe]' },
  CONNECTED: { label: 'Connected', badgeClass: 'bg-[#e8f5e9] text-[#0a2e0e] border-[#39bf45]' },
  CLOSED: { label: 'Closed', badgeClass: 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]' },
};

interface GlobalSearchProps {
  userRole?: UserRole;
}

export default function GlobalSearch({ userRole }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProjectResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Detect OS for shortcut label
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      const res = await searchProjectsAction(query);
      setResults(res.results || []);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectResult = (projectId: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(getProjectUrlForRole(projectId, userRole));
  };

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm" ref={searchContainerRef}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#9297a0]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search client, phone, address..."
          className="h-8 w-full rounded-md border border-[#e0e2e6] bg-[#f8fafc] pl-8 pr-14 text-xs text-[#181d26] placeholder:text-[#9297a0] transition-colors focus:border-[#181d26] focus:bg-[#ffffff] focus:outline-none shadow-2xs"
        />

        {/* Shortcut or Clear button */}
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-2 p-0.5 text-[#9297a0] hover:text-[#181d26]"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <span className="pointer-events-none absolute right-2 rounded border border-[#e0e2e6] bg-[#ffffff] px-1.5 py-0.5 text-[9px] font-semibold text-[#9297a0]">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </span>
        )}
      </div>

      {/* Results Dropdown Popover */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 sm:right-0 z-50 mt-1.5 w-full sm:w-[420px] origin-top-left rounded-lg border border-[#e0e2e6] bg-[#ffffff] shadow-xl ring-1 ring-black/5 focus:outline-none overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#f0f2f5] bg-[#fafbfc] px-3 py-2 text-[11px] font-semibold text-[#808693]">
            <span>Project Results ({results.length})</span>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin text-[#9297a0]" />}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#f0f2f5]">
            {isLoading && results.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-xs text-[#9297a0]">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Searching projects...
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#9297a0]">
                No matching projects found for &quot;{query}&quot;
              </div>
            ) : (
              results.map((p) => {
                const stageInfo = STAGE_LABELS[p.stage] || {
                  label: p.stage,
                  badgeClass: 'bg-[#f0f2f5] text-[#333840] border-[#d0d4dc]',
                };
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectResult(p.id)}
                    className="group flex items-start justify-between gap-3 p-3 text-xs cursor-pointer hover:bg-[#f8fafc] transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#181d26] truncate">{p.client_name}</span>
                        <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-semibold border ${stageInfo.badgeClass}`}>
                          {stageInfo.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#5f6570]">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-[#9297a0]" />
                          {p.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-[#9297a0]" />
                          {p.kw_required} kW
                        </span>
                      </div>
                      <p className="text-[10px] text-[#9297a0] truncate flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        {p.address}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 shrink-0 text-[#9297a0] opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
