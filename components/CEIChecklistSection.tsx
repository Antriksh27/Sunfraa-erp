'use client';

import { useState } from 'react';
import { CEIChecklist } from '@/types/database';
import { saveCEIChecklistAction } from '@/app/design/actions';
import { ShieldAlert, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface CEIChecklistSectionProps {
  projectId: string;
  checklist: CEIChecklist | null;
  canEdit: boolean;
}

export default function CEIChecklistSection({
  projectId,
  checklist,
  canEdit,
}: CEIChecklistSectionProps) {
  const [earthingPit, setEarthingPit] = useState(checklist?.earthing_pit_verified || false);
  const [lightningArrestor, setLightningArrestor] = useState(checklist?.lightning_arrestor_verified || false);
  const [transformerHt, setTransformerHt] = useState(checklist?.transformer_ht_attached || false);
  const [feeChallan, setFeeChallan] = useState(checklist?.cei_fee_challan_attached || false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAllChecked = earthingPit && lightningArrestor && transformerHt && feeChallan;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const res = await saveCEIChecklistAction(projectId, {
      earthingPit,
      lightningArrestor,
      transformerHt,
      feeChallan,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
            Mandatory CEI Drawing Review Checklist (&gt;10 kW HT/LT Gating)
          </h3>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            isAllChecked ? 'bg-[#e8f5e9] text-[#0a2e0e] border border-[#a8d8c4]' : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {isAllChecked ? 'CEI Gating Cleared (4/4)' : 'Pending Verification'}
        </span>
      </div>

      {error && <p className="text-xs text-[#aa2d00]">{error}</p>}
      {success && <p className="text-xs text-[#16a34a] font-semibold">CEI checklist verification updated successfully.</p>}

      <form onSubmit={handleSave} className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-3 rounded-lg border border-[#e0e2e6] p-3 bg-[#fafbfc] cursor-pointer">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={earthingPit}
              onChange={(e) => setEarthingPit(e.target.checked)}
              className="h-4 w-4 rounded border-[#e0e2e6] text-[#181d26] focus:ring-[#181d26]"
            />
            <div>
              <p className="font-semibold text-[#181d26]">Earthing Pit Layout Verified</p>
              <p className="text-[10px] text-[#5f6570]">Dual earthing for inverter & structure</p>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-[#e0e2e6] p-3 bg-[#fafbfc] cursor-pointer">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={lightningArrestor}
              onChange={(e) => setLightningArrestor(e.target.checked)}
              className="h-4 w-4 rounded border-[#e0e2e6] text-[#181d26] focus:ring-[#181d26]"
            />
            <div>
              <p className="font-semibold text-[#181d26]">Lightning Arrestor (LA) Coverage</p>
              <p className="text-[10px] text-[#5f6570]">ESE or conventional cone calculation</p>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-[#e0e2e6] p-3 bg-[#fafbfc] cursor-pointer">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={transformerHt}
              onChange={(e) => setTransformerHt(e.target.checked)}
              className="h-4 w-4 rounded border-[#e0e2e6] text-[#181d26] focus:ring-[#181d26]"
            />
            <div>
              <p className="font-semibold text-[#181d26]">Transformer & HT Panel Integration</p>
              <p className="text-[10px] text-[#5f6570]">Breaker rating & relay coordination drawing</p>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-[#e0e2e6] p-3 bg-[#fafbfc] cursor-pointer">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={feeChallan}
              onChange={(e) => setFeeChallan(e.target.checked)}
              className="h-4 w-4 rounded border-[#e0e2e6] text-[#181d26] focus:ring-[#181d26]"
            />
            <div>
              <p className="font-semibold text-[#181d26]">CEI Inspection Fee Challan</p>
              <p className="text-[10px] text-[#5f6570]">Government inspection treasury receipt</p>
            </div>
          </label>
        </div>

        {canEdit && (
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1 rounded bg-[#181d26] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Save CEI Checklist
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
