'use client';

import { useState, useEffect, useRef } from 'react';
import { Bookmark, BookmarkPlus, Check, ChevronDown, Trash2, X, Loader2 } from 'lucide-react';
import { SavedView } from '@/types/database';
import { getSavedViewsAction, saveViewAction, deleteSavedViewAction } from '@/app/actions/savedViews';

interface SavedViewsDropdownProps {
  moduleName: string;
  currentFilters: Record<string, any>;
  onApplyView: (filters: Record<string, any>) => void;
  onResetView?: () => void;
  defaultViewName?: string;
}

export default function SavedViewsDropdown({
  moduleName,
  currentFilters,
  onApplyView,
  onResetView,
  defaultViewName = 'Default View',
}: SavedViewsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Save new view state
  const [isCreating, setIsCreating] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load saved views on mount or module change
  useEffect(() => {
    let isMounted = true;
    async function loadViews() {
      setIsLoading(true);
      const res = await getSavedViewsAction(moduleName);
      if (isMounted && res.data) {
        setSavedViews(res.data);
      }
      if (isMounted) setIsLoading(false);
    }
    loadViews();
    return () => {
      isMounted = false;
    };
  }, [moduleName]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setSaveError(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectView = (view: SavedView) => {
    setActiveViewId(view.id);
    onApplyView(view.filter_json);
    setIsOpen(false);
  };

  const handleSelectDefault = () => {
    setActiveViewId(null);
    if (onResetView) {
      onResetView();
    }
    setIsOpen(false);
  };

  const handleSaveView = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViewName.trim()) return;

    setIsSaving(true);
    setSaveError(null);

    const res = await saveViewAction(moduleName, newViewName.trim(), currentFilters);

    if (res.error) {
      setSaveError(res.error);
    } else if (res.data) {
      const updatedList = [res.data, ...savedViews.filter((v) => v.id !== res.data!.id)];
      setSavedViews(updatedList);
      setActiveViewId(res.data.id);
      setNewViewName('');
      setIsCreating(false);
      setIsOpen(false);
    }
    setIsSaving(false);
  };

  const handleDeleteView = async (e: React.MouseEvent, viewId: string) => {
    e.stopPropagation();
    const res = await deleteSavedViewAction(viewId);
    if (res.success) {
      setSavedViews((prev) => prev.filter((v) => v.id !== viewId));
      if (activeViewId === viewId) {
        setActiveViewId(null);
      }
    }
  };

  const activeView = savedViews.find((v) => v.id === activeViewId);
  const currentViewLabel = activeView ? activeView.view_name : defaultViewName;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors shadow-2xs ${
          activeViewId
            ? 'border-[#181d26] bg-[#f8fafc] text-[#181d26] font-semibold'
            : 'border-[#e0e2e6] bg-[#ffffff] text-[#41454d] hover:bg-[#f8fafc] hover:text-[#181d26]'
        }`}
      >
        <Bookmark className={`h-3.5 w-3.5 ${activeViewId ? 'text-[#181d26] fill-[#181d26]' : 'text-[#9297a0]'}`} />
        <span className="max-w-[120px] truncate">{currentViewLabel}</span>
        <ChevronDown className="h-3 w-3 text-[#9297a0]" />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 z-30 mt-1.5 w-64 origin-top-left rounded-lg border border-[#e0e2e6] bg-[#ffffff] py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
          <div className="px-3 py-1.5 border-b border-[#f0f2f5] flex items-center justify-between text-[11px] font-semibold text-[#808693] uppercase tracking-wider">
            <span>Views & Filters</span>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin text-[#9297a0]" />}
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {/* Default View Item */}
            <button
              type="button"
              onClick={handleSelectDefault}
              className={`flex w-full items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                !activeViewId ? 'bg-[#f0f4ff] text-[#181d26] font-medium' : 'text-[#333840] hover:bg-[#f8fafc]'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Bookmark className="h-3.5 w-3.5 text-[#9297a0]" />
                <span className="truncate">{defaultViewName}</span>
              </div>
              {!activeViewId && <Check className="h-3.5 w-3.5 text-[#aa2d00]" />}
            </button>

            {/* User's Saved Views */}
            {savedViews.map((view) => (
              <div
                key={view.id}
                onClick={() => handleSelectView(view)}
                className={`group flex w-full items-center justify-between px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                  activeViewId === view.id
                    ? 'bg-[#f0f4ff] text-[#181d26] font-medium'
                    : 'text-[#333840] hover:bg-[#f8fafc]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Bookmark className="h-3.5 w-3.5 text-[#aa2d00] fill-[#aa2d00]" />
                  <span className="truncate">{view.view_name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {activeViewId === view.id && <Check className="h-3.5 w-3.5 text-[#aa2d00]" />}
                  <button
                    type="button"
                    title="Delete view"
                    onClick={(e) => handleDeleteView(e, view.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-600 p-0.5 rounded transition-opacity"
                  >
                    <Trash2 className="h-3 w-3 text-[#9297a0] hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#f0f2f5] p-2">
            {!isCreating ? (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[#d0d4dc] bg-[#f8fafc] py-1.5 text-xs font-medium text-[#41454d] hover:border-[#181d26] hover:text-[#181d26] transition-colors"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                Save Current View
              </button>
            ) : (
              <form onSubmit={handleSaveView} className="space-y-2">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="e.g. Commercial Leads"
                    className="h-7 w-full rounded border border-[#d0d4dc] px-2 text-xs text-[#181d26] placeholder:text-[#9297a0] focus:border-[#181d26] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setSaveError(null);
                    }}
                    className="p-1 text-[#9297a0] hover:text-[#181d26]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {saveError && <p className="text-[10px] text-red-600">{saveError}</p>}
                <button
                  type="submit"
                  disabled={!newViewName.trim() || isSaving}
                  className="flex h-7 w-full items-center justify-center gap-1 rounded bg-[#181d26] text-xs font-medium text-white hover:bg-[#0d1218] disabled:opacity-50 transition-colors"
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save View'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
