'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Download, X, CheckCircle2 } from 'lucide-react';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    }

    // 2. Offline Status Listener
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);

      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // 3. Before Install Prompt Listener
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e);
        setShowInstallBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, []);

  async function handleInstallClick() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setInstallPrompt(null);
  }

  return (
    <>
      {/* Sticky Persistent Offline Banner */}
      {isOffline && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-[#aa2d00] px-4 py-2 text-xs font-bold text-white shadow-md">
          <WifiOff className="h-4 w-4 animate-pulse" />
          <span>Offline mode active — changes will sync once internet connectivity is restored.</span>
        </div>
      )}

      {/* PWA Mobile Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border border-[#e0e2e6] bg-white p-3.5 shadow-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#181d26] text-white font-bold">
              <Download className="h-4 w-4 text-[#fcab79]" />
            </div>
            <div>
              <h5 className="font-bold text-[#181d26]">Install Sunfraa ERP App</h5>
              <p className="text-[11px] text-[#5f6570]">Faster field surveys & offline site access</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="rounded bg-[#181d26] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0d1218]"
            >
              Install
            </button>
            <button
              type="button"
              onClick={() => setShowInstallBanner(false)}
              className="p-1 text-[#9297a0] hover:text-[#181d26]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
