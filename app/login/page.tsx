'use client';

import { Suspense, useState } from 'react';
import { loginAction } from '@/app/auth/actions';
import { Layers, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const isDeactivated = searchParams.get('error') === 'deactivated';

  const [error, setError] = useState<string | null>(
    isDeactivated ? 'Your account has been deactivated. Please contact your Director.' : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-[#fcab79] bg-[#fff0eb] p-3 text-xs text-[#aa2d00]">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#aa2d00]" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold text-[#181d26]"
        >
          Username or Work Email
        </label>
        <div className="relative mt-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9297a0]">
            <Mail className="h-4 w-4" />
          </div>
          <input
            id="email"
            name="email"
            type="text"
            autoComplete="username"
            required
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="name@sunfraa.com or username"
            className="block w-full rounded-md border border-[#e0e2e6] bg-[#ffffff] py-2 pl-9 pr-3 text-sm text-[#181d26] placeholder:text-[#9297a0] focus:border-[#181d26] focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold text-[#181d26]"
        >
          Password
        </label>
        <div className="relative mt-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9297a0]">
            <Lock className="h-4 w-4" />
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="••••••••"
            className="block w-full rounded-md border border-[#e0e2e6] bg-[#ffffff] py-2 pl-9 pr-3 text-sm text-[#181d26] placeholder:text-[#9297a0] focus:border-[#181d26] focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center items-center gap-2 rounded-full bg-[#181d26] px-4 py-2.5 text-sm font-medium text-white shadow-2xs hover:bg-[#0d1218] transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#fcab79]" />
              Signing in...
            </>
          ) : (
            'Sign In to Workspace'
          )}
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#f8fafc] py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-2">
          <img
            src="/logo.png"
            alt="Sunfraa Global"
            className="h-28 w-auto object-contain"
          />
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-[#181d26]">
            Enterprise Operations Portal
          </span>
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold tracking-wide rounded bg-[#181d26] text-white shadow-2xs">
            ERP
          </span>
        </div>
        <p className="mt-1 text-center text-xs text-[#41454d]">
          Solar EPC Execution, Engineering Studio & Statutory Liaisoning
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="border border-[#e0e2e6] bg-[#ffffff] px-6 py-8 shadow-2xs sm:rounded-xl sm:px-8">
          <Suspense fallback={<div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-[#181d26]" /></div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

