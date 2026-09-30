'use client';

import { useState } from 'react';
import { setupInitialProfile } from '@/app/auth/actions';
import { ShieldCheck, User, Phone, Loader2, AlertCircle } from 'lucide-react';

export default function SetupProfilePage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await setupInitialProfile(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#fafbfc] py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-[#181d26]">
          Initial Director Setup
        </h2>
        <p className="mt-1 text-center text-xs text-[#41454d]">
          Complete your profile to bootstrap the Sunfraa Global platform.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="border border-[#e0e2e6] bg-white px-4 py-8 shadow-sm sm:rounded-xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-[#333840]"
              >
                Full Name
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9297a0]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Director Name"
                  className="block w-full rounded-lg border border-[#d0d4dc] py-2 pl-9 pr-3 text-sm text-[#181d26] placeholder:text-[#9297a0] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold text-[#333840]"
              >
                Phone Number (Optional)
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9297a0]">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="block w-full rounded-lg border border-[#d0d4dc] py-2 pl-9 pr-3 text-sm text-[#181d26] placeholder:text-[#9297a0] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
