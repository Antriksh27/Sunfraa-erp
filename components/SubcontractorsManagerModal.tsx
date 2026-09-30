'use client';

import { useState } from 'react';
import { Subcontractor, SubcontractorTrade, SubcontractorRateType } from '@/types/database';
import {
  createSubcontractorAction,
  toggleSubcontractorActiveAction,
} from '@/app/execution/actions';
import { Users, Plus, X, Phone, Check, AlertCircle, Loader2 } from 'lucide-react';

interface SubcontractorsManagerModalProps {
  subcontractors: Subcontractor[];
  onClose: () => void;
}

export default function SubcontractorsManagerModal({
  subcontractors = [],
  onClose,
}: SubcontractorsManagerModalProps) {
  const [list, setList] = useState<Subcontractor[]>(subcontractors);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createSubcontractorAction(formData);

    if (res?.error) {
      setError(res.error);
    } else if (res.subcontractor) {
      setList((prev) => [...prev, res.subcontractor!]);
      setIsAdding(false);
    }
    setLoading(false);
  }

  async function handleToggleActive(sub: Subcontractor) {
    const nextState = !sub.is_active;
    setError(null);
    setList((prev) => prev.map((s) => (s.id === sub.id ? { ...s, is_active: nextState } : s)));
    const res = await toggleSubcontractorActiveAction(sub.id, nextState);
    if (res?.error) {
      setError(res.error);
      setList((prev) => prev.map((s) => (s.id === sub.id ? { ...s, is_active: sub.is_active } : s)));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e0e2e6] bg-[#fafbfc] px-6 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#181d26]" />
            <span className="text-sm font-bold text-[#181d26]">Subcontractors & Labour Master</span>
            <span className="rounded bg-[#f0f2f5] px-2 py-0.5 text-[10px] font-bold text-[#333840]">
              {list.length} Vendors
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1 rounded bg-[#181d26] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0d1218]"
              >
                <Plus className="h-3 w-3" />
                Add Subcontractor
              </button>
            )}
            <button type="button" onClick={onClose} className="rounded p-1 text-[#9297a0] hover:text-[#181d26]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-[#fcab79] bg-[#fff0eb] p-3 text-[#aa2d00]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add New Subcontractor Form */}
          {isAdding && (
            <form onSubmit={handleCreate} className="rounded-lg border border-[#e0e2e6] bg-[#fafbfc] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-2 font-bold text-[#181d26]">
                <span>New Subcontractor Record</span>
                <button type="button" onClick={() => setIsAdding(false)} className="text-[#9297a0] hover:text-[#181d26]">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Contractor / Agency Name *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Apex Solar Erectors"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Phone / WhatsApp *</label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Trade Specialization *</label>
                  <select name="trade" defaultValue="STRUCTURE" className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs">
                    <option value="STRUCTURE">Structure Fabrication & Erection</option>
                    <option value="PANEL">Panel Mounting & Clamping</option>
                    <option value="WIRING">AC/DC Solar Wiring & Inverter Connection</option>
                    <option value="CIVIL">Civil Foundation & Grouting</option>
                    <option value="ALL">Turnkey All-in-One EPC</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#181d26]">Rate Type *</label>
                    <select name="rateType" defaultValue="PER_KW" className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs">
                      <option value="PER_KW">₹ per kW</option>
                      <option value="PER_DAY">₹ per Day</option>
                      <option value="LUMPSUM">₹ Lumpsum</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#181d26]">Default Rate (₹)</label>
                    <input
                      name="defaultRate"
                      type="number"
                      defaultValue={400}
                      className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e0e2e6]">
                <button type="button" onClick={() => setIsAdding(false)} className="rounded px-3 py-1 font-medium text-[#5f6570]">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="rounded bg-[#181d26] px-4 py-1 font-semibold text-white disabled:opacity-50">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Subcontractor'}
                </button>
              </div>
            </form>
          )}

          {/* Subcontractor List Table */}
          <table className="w-full text-left border border-[#e0e2e6] rounded-lg overflow-hidden">
            <thead className="bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570] border-b border-[#e0e2e6]">
              <tr>
                <th className="p-2.5">Name</th>
                <th className="p-2.5">Trade</th>
                <th className="p-2.5">Phone</th>
                <th className="p-2.5">Rate</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5]">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-[#5f6570]">
                    <Users className="mx-auto h-7 w-7 text-[#d0d4dc] mb-2" />
                    <p className="font-semibold text-[#181d26]">No Subcontractors Registered</p>
                    <p className="text-[11px] text-[#5f6570] mt-0.5">Add your vetted solar civil, mechanical, or electrical contractors using the form above.</p>
                  </td>
                </tr>
              ) : (
                list.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#fafbfc]">
                    <td className="p-2.5 font-bold text-[#181d26]">{sub.name}</td>
                    <td className="p-2.5">
                      <span className="rounded bg-[#f0f2f5] px-2 py-0.5 text-[10px] font-semibold text-[#181d26]">
                        {sub.trade}
                      </span>
                    </td>
                    <td className="p-2.5 text-[#5f6570] flex items-center gap-1">
                      <Phone className="h-3 w-3 text-[#9297a0]" />
                      {sub.phone}
                    </td>
                    <td className="p-2.5 font-semibold text-[#181d26]">
                      ₹{Number(sub.default_rate).toLocaleString('en-IN')} / {sub.rate_type.replace('PER_', '')}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${sub.is_active ? 'bg-[#e8f5e9] text-[#15803d] border border-[#a8d8c4]' : 'bg-[#f0f2f5] text-[#5f6570]'}`}>
                        {sub.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(sub)}
                        className="text-[11px] font-semibold text-[#aa2d00] hover:underline"
                      >
                        {sub.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
