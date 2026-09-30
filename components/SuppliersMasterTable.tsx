'use client';

import { useState } from 'react';
import { Supplier, SupplierPaymentTerms } from '@/types/database';
import { createSupplierAction, toggleSupplierActiveAction } from '@/app/store/actions';
import { Truck, Plus, Star, Phone, Mail, MapPin, X, Loader2 } from 'lucide-react';

interface SuppliersMasterTableProps {
  suppliers: Supplier[];
  canEdit: boolean;
}

export default function SuppliersMasterTable({ suppliers, canEdit }: SuppliersMasterTableProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await createSupplierAction(formData);

    if (res?.error) {
      setError(res.error);
    } else {
      setShowAddModal(false);
    }
    setLoading(false);
  }

  async function handleToggle(id: string, current: boolean) {
    await toggleSupplierActiveAction(id, !current);
  }

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] shadow-2xs overflow-hidden space-y-4">
      <div className="p-4 border-b border-[#f0f2f5] bg-[#fafbfc] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-[#181d26]" />
          <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
            Authorized Vendor & Supplier Master Directory ({suppliers.length})
          </h3>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 rounded bg-[#181d26] px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218]"
          >
            <Plus className="h-3 w-3" />
            Add Supplier
          </button>
        )}
      </div>

      <div className="overflow-x-auto px-4 pb-4">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570] border-y border-[#e0e2e6]">
            <tr>
              <th className="p-2.5">Supplier Name & Contact</th>
              <th className="p-2.5">Phone & Email</th>
              <th className="p-2.5">City</th>
              <th className="p-2.5">GSTIN</th>
              <th className="p-2.5">Payment Terms</th>
              <th className="p-2.5">Rating</th>
              <th className="p-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2f5]">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-[#5f6570]">
                  <Truck className="mx-auto h-8 w-8 text-[#d0d4dc] mb-2" />
                  <p className="font-semibold text-[#181d26]">No Suppliers Registered</p>
                  <p className="text-[11px] text-[#5f6570] mt-1">
                    {canEdit ? 'Add your verified solar equipment vendors and procurement partners using "Add Supplier".' : 'No supplier vendors have been onboarded in the directory yet.'}
                  </p>
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-[#fafbfc]">
                  <td className="p-2.5">
                    <p className="font-bold text-[#181d26]">{s.name}</p>
                    <p className="text-[10px] text-[#5f6570]">Contact: {s.contact_person || '—'}</p>
                  </td>
                  <td className="p-2.5 space-y-0.5">
                    <p className="text-[#181d26] flex items-center gap-1 font-medium">
                      <Phone className="h-3 w-3 text-[#9297a0]" />
                      {s.phone}
                    </p>
                    {s.email && (
                      <p className="text-[10px] text-[#5f6570] flex items-center gap-1">
                        <Mail className="h-3 w-3 text-[#9297a0]" />
                        {s.email}
                      </p>
                    )}
                  </td>
                  <td className="p-2.5 text-[#5f6570]">{s.city}</td>
                  <td className="p-2.5 font-mono text-[#5f6570]">{s.gstin || '—'}</td>
                  <td className="p-2.5">
                    <span className="rounded bg-[#f0f2f5] px-2 py-0.5 text-[10px] font-semibold text-[#181d26]">
                      {s.payment_terms.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: s.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-500" />
                      ))}
                    </div>
                  </td>
                  <td className="p-2.5 text-right">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleToggle(s.id, s.is_active)}
                        className="text-[11px] font-semibold text-[#aa2d00] hover:underline"
                      >
                        {s.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-3">
              <h3 className="text-sm font-bold text-[#181d26]">Add Vendor / Supplier</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-[#9297a0] hover:text-[#181d26]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && <p className="text-xs text-[#aa2d00]">{error}</p>}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Supplier / Company Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Adani Solar Direct"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Contact Person</label>
                  <input
                    name="contactPerson"
                    type="text"
                    placeholder="e.g. Nilesh Shah"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Phone / WhatsApp *</label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="+91 98250 12345"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="sales@supplier.com"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">City / Location</label>
                  <input
                    name="city"
                    type="text"
                    defaultValue="Ahmedabad"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">GSTIN</label>
                  <input
                    name="gstin"
                    type="text"
                    placeholder="24AAACW1234F1Z1"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Payment Terms</label>
                  <select name="paymentTerms" defaultValue="NET_30" className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs">
                    <option value="ADVANCE">Advance</option>
                    <option value="NET_15">Net 15 Days</option>
                    <option value="NET_30">Net 30 Days</option>
                    <option value="NET_60">Net 60 Days</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e2e6]">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded px-3 py-1 text-xs text-[#5f6570]">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="rounded bg-[#181d26] px-4 py-1 text-xs font-semibold text-white disabled:opacity-50">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
