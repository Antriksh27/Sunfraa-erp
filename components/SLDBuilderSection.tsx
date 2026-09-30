'use client';

import { useState } from 'react';
import { SLDSpecification, DesignSystemType } from '@/types/database';
import { saveSLDSpecificationAction } from '@/app/design/actions';
import { Zap, Cpu, Check, Loader2, GitBranch } from 'lucide-react';

interface SLDBuilderSectionProps {
  projectId: string;
  defaultKw: number;
  specification: SLDSpecification | null;
  canEdit: boolean;
}

export default function SLDBuilderSection({
  projectId,
  defaultKw,
  specification,
  canEdit,
}: SLDBuilderSectionProps) {
  const [systemType, setSystemType] = useState<DesignSystemType>(specification?.system_type || 'STRING_INVERTER');
  const [inverterKw, setInverterKw] = useState<number>(specification?.inverter_kw || defaultKw || 5);
  const [panelCount, setPanelCount] = useState<number>(specification?.panel_count || Math.round(defaultKw * 1000 / 545) || 10);
  const [stringCount, setStringCount] = useState<number>(specification?.string_count || 2);
  const [dcCableLength, setDcCableLength] = useState<number>(specification?.dc_cable_length_m || 40);
  const [acCableLength, setAcCableLength] = useState<number>(specification?.ac_cable_length_m || 15);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const panelsPerString = stringCount > 0 ? Math.ceil(panelCount / stringCount) : panelCount;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const res = await saveSLDSpecificationAction(projectId, {
      systemType,
      inverterKw,
      panelCount,
      stringCount,
      dcCableLengthM: dcCableLength,
      acCableLengthM: acCableLength,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      setSaved(true);
    }
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-[#aa2d00]" />
          <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
            Single Line Diagram (SLD) Technical Generator
          </h3>
        </div>
        <span className="rounded bg-[#fff0eb] px-2 py-0.5 text-[10px] font-bold text-[#882400] border border-[#fcab79]">
          Auto Sizing Template
        </span>
      </div>

      {error && <p className="text-xs text-[#aa2d00]">{error}</p>}
      {saved && <p className="text-xs text-[#16a34a] font-semibold">SLD technical specification saved successfully.</p>}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#181d26]">System Architecture</label>
            <select
              value={systemType}
              disabled={!canEdit}
              onChange={(e) => setSystemType(e.target.value as DesignSystemType)}
              className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs"
            >
              <option value="STRING_INVERTER">Central String Inverter</option>
              <option value="MICRO_INVERTER">Module Micro-Inverter</option>
              <option value="HYBRID">Hybrid Solar + Battery Storage</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#181d26]">Inverter Rating (kW)</label>
            <input
              type="number"
              step="0.1"
              disabled={!canEdit}
              value={inverterKw}
              onChange={(e) => setInverterKw(parseFloat(e.target.value) || 0)}
              className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#181d26]">Total PV Modules</label>
            <input
              type="number"
              disabled={!canEdit}
              value={panelCount}
              onChange={(e) => setPanelCount(parseInt(e.target.value, 10) || 0)}
              className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#181d26]">DC MPPT Strings</label>
            <input
              type="number"
              min="1"
              disabled={!canEdit}
              value={stringCount}
              onChange={(e) => setStringCount(parseInt(e.target.value, 10) || 1)}
              className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#181d26]">DC Cable Run (m)</label>
            <input
              type="number"
              disabled={!canEdit}
              value={dcCableLength}
              onChange={(e) => setDcCableLength(parseFloat(e.target.value) || 0)}
              className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#181d26]">AC Cable Run (m)</label>
            <input
              type="number"
              disabled={!canEdit}
              value={acCableLength}
              onChange={(e) => setAcCableLength(parseFloat(e.target.value) || 0)}
              className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs"
            />
          </div>
        </div>

        {/* Standardized SLD Block Preview */}
        <div className="rounded-lg bg-[#fafbfc] p-4 border border-[#e0e2e6] space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6570]">
            Generated Technical SLD Block Specification
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded bg-white border border-[#f0f2f5]">
              <span className="text-[#5f6570] block">String Configuration</span>
              <strong className="text-[#181d26]">{stringCount} Strings × {panelsPerString} Panels</strong>
            </div>
            <div className="p-2 rounded bg-white border border-[#f0f2f5]">
              <span className="text-[#5f6570] block">Inverter Topology</span>
              <strong className="text-[#181d26]">{inverterKw} kW {systemType.replace(/_/g, ' ')}</strong>
            </div>
            <div className="p-2 rounded bg-white border border-[#f0f2f5]">
              <span className="text-[#5f6570] block">DC Cabling Spec</span>
              <strong className="text-[#181d26]">{dcCableLength}m (4/6 sq mm 1C)</strong>
            </div>
            <div className="p-2 rounded bg-white border border-[#f0f2f5]">
              <span className="text-[#5f6570] block">AC Output Run</span>
              <strong className="text-[#181d26]">{acCableLength}m (4C Armoured)</strong>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1 rounded bg-[#181d26] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Save SLD Specifications
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
