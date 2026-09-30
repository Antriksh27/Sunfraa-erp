'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createLeadAction, checkDuplicateLeadAction } from '@/app/pipeline/actions';
import {
  ArrowLeft,
  UserPlus,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Zap,
  Flame,
  Calendar,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { Profile, ProjectCategory, LeadSource, LeadTemperature } from '@/types/database';

interface LeadIntakeFormProps {
  currentUser: Profile;
  salesStaff: Profile[];
  isDirector: boolean;
}

export default function LeadIntakeForm({
  currentUser,
  salesStaff,
  isDirector,
}: LeadIntakeFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [kw, setKw] = useState<number>(5);

  // Live duplicate detection
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [duplicates, setDuplicates] = useState<{ id: string; client_name: string; phone: string; stage: string }[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  useEffect(() => {
    if (!phone.trim() && !address.trim()) {
      setDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDuplicates(true);
      const res = await checkDuplicateLeadAction(phone, address);
      setDuplicates(res.duplicates || []);
      setCheckingDuplicates(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [phone, address]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createLeadAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 font-sans">
      {/* Back link & Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/pipeline"
          className="flex items-center gap-1 text-xs font-semibold text-[#41454d] hover:text-[#181d26]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Pipeline
        </Link>
        <span className="text-xs text-[#9297a0]">/</span>
        <h2 className="text-xs font-bold text-[#181d26]">New Lead Record</h2>
      </div>

      {/* Duplicate Warning Banner */}
      {duplicates.length > 0 && (
        <div className="rounded-lg border border-[#fef08a] bg-[#fefce8] p-4 text-xs shadow-2xs">
          <div className="flex items-start gap-2 text-[#854d0e]">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#ca8a04]" />
            <div className="flex-1">
              <span className="font-bold">Duplicate Warning: </span>
              <span>
                Found {duplicates.length} existing project(s) with matching phone or address.
              </span>
              <div className="mt-2 space-y-1">
                {duplicates.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded bg-white/80 px-2 py-1 text-[11px] border border-yellow-200">
                    <span className="font-semibold text-[#181d26]">{d.client_name} ({d.phone})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#854d0e] font-medium">Stage: {d.stage}</span>
                      <Link
                        href={`/pipeline/${d.id}`}
                        target="_blank"
                        className="flex items-center gap-0.5 text-[#aa2d00] hover:underline"
                      >
                        <span>View</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-6 shadow-2xs">
        <div className="mb-5 pb-3 border-b border-[#f0f2f5]">
          <h3 className="text-sm font-bold text-[#181d26]">Solar Project Intake</h3>
          <p className="text-[11px] text-[#41454d]">
            Enter prospective client details, lead acquisition source, temperature, and solar energy capacity
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-[#fcab79] bg-[#fff0eb] p-3 text-xs text-[#aa2d00]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#aa2d00]" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#181d26]">
                Client / Business Name <span className="text-[#aa2d00]">*</span>
              </label>
              <input
                name="clientName"
                type="text"
                required
                placeholder="e.g. Ramesh Patel / Sunrise Mills"
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] bg-[#ffffff] px-3 py-2 text-xs text-[#181d26] placeholder:text-[#9297a0] focus:border-[#181d26] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">
                Contact Phone <span className="text-[#aa2d00]">*</span>
              </label>
              <input
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] bg-[#ffffff] px-3 py-2 text-xs text-[#181d26] placeholder:text-[#9297a0] focus:border-[#181d26] focus:outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#181d26]">
                Site Address <span className="text-[#aa2d00]">*</span>
              </label>
              <textarea
                name="address"
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Survey / Plot No, Street, City, Pincode"
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] bg-[#ffffff] px-3 py-2 text-xs text-[#181d26] placeholder:text-[#9297a0] focus:border-[#181d26] focus:outline-none transition-colors"
              />
            </div>

            {/* Lead Source & Source Detail */}
            <div>
              <label className="block text-xs font-semibold text-[#181d26]">
                Lead Source
              </label>
              <select
                name="leadSource"
                defaultValue="REFERRAL"
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] bg-[#ffffff] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none transition-colors"
              >
                <option value="REFERRAL">Referral (Client / Partner)</option>
                <option value="PAID_ADS">Paid Ads (Meta / Google)</option>
                <option value="CAMPAIGN">Marketing Campaign / Expo</option>
                <option value="WALK_IN">Walk-In / Direct Inquiry</option>
                <option value="GOVT_TENDER">Govt / Institutional Tender</option>
                <option value="COLD_OUTREACH">Cold Calling / Field Outreach</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">
                Source Detail / Campaign Name
              </label>
              <input
                name="sourceDetail"
                type="text"
                placeholder="e.g. Referrer Name, Meta Ad #4, Solar Expo"
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] bg-[#ffffff] px-3 py-2 text-xs text-[#181d26] placeholder:text-[#9297a0] focus:border-[#181d26] focus:outline-none transition-colors"
              />
            </div>

            {/* Temperature & Expected Close Date */}
            <div>
              <label className="block text-xs font-semibold text-[#181d26]">
                Lead Temperature
              </label>
              <select
                name="temperature"
                defaultValue="HOT"
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] bg-[#ffffff] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none transition-colors"
              >
                <option value="HOT">🔥 Hot (High Intent / Ready to Purchase)</option>
                <option value="WARM">⚡ Warm (Interested / Evaluating Quote)</option>
                <option value="COLD">❄️ Cold (Long Term / Initial Inquiry)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">
                Expected Close Date
              </label>
              <input
                name="expectedCloseDate"
                type="date"
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] bg-[#ffffff] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">
                Project Category <span className="text-[#aa2d00]">*</span>
              </label>
              <select
                name="category"
                required
                defaultValue="RESIDENTIAL_BUNGALOW"
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] bg-[#ffffff] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none transition-colors"
              >
                <option value="RESIDENTIAL_BUNGALOW">Residential Bungalow</option>
                <option value="RESIDENTIAL_FLAT">Residential Flat</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INDUSTRIAL">Industrial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">
                Required Solar Capacity (kW) <span className="text-[#aa2d00]">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  name="kwRequired"
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={kw}
                  onChange={(e) => setKw(parseFloat(e.target.value) || 0)}
                  className="block w-full rounded-md border border-[#e0e2e6] bg-[#ffffff] px-3 py-2 pr-10 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none transition-colors"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[11px] font-semibold text-[#9297a0]">
                  kW
                </div>
              </div>
              {kw > 10 && (
                <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-[#7c2d12]">
                  <Zap className="h-3 w-3 text-[#ea580c]" />
                  &gt;10 kW project: CEI inspection & drawings will be automatically required.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">
                Sanctioned Load (Optional)
              </label>
              <input
                name="sanctionedLoad"
                type="text"
                placeholder="e.g. 15 kW / 3 Phase"
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] bg-[#ffffff] px-3 py-2 text-xs text-[#181d26] placeholder:text-[#9297a0] focus:border-[#181d26] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">
                Electricity Connection / Consumer No. (Optional)
              </label>
              <input
                name="connectionNumber"
                type="text"
                placeholder="e.g. 0398210398"
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] bg-[#ffffff] px-3 py-2 text-xs text-[#181d26] placeholder:text-[#9297a0] focus:border-[#181d26] focus:outline-none transition-colors"
              />
            </div>

            {/* Sales Representative Assignment */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#181d26]">
                Assigned Sales Executive
              </label>
              {isDirector ? (
                <select
                  name="leadOwnerId"
                  defaultValue={currentUser.id}
                  className="mt-1 block w-full rounded-md border border-[#e0e2e6] bg-[#ffffff] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none transition-colors"
                >
                  <option value={currentUser.id}>{currentUser.name} (Director / Self)</option>
                  {salesStaff
                    .filter((s) => s.id !== currentUser.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                </select>
              ) : (
                <div className="mt-1 flex items-center justify-between rounded-md border border-[#e0e2e6] bg-[#f8fafc] px-3 py-2 text-xs text-[#41454d]">
                  <span>{currentUser.name} (You)</span>
                  <span className="rounded bg-[#e0e2e6] px-1.5 py-0.5 text-[10px] font-semibold text-[#181d26]">
                    Self-Assigned
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#f0f2f5] pt-4 mt-6">
            <Link
              href="/pipeline"
              className="rounded-md border border-[#e0e2e6] px-4 py-2 text-xs font-medium text-[#41454d] hover:bg-[#f8fafc] hover:text-[#181d26] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-md bg-[#181d26] px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218] disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating Lead...
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  Create Lead Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
