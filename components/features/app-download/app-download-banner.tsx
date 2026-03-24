'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';

const DISMISS_KEY = 'argufight_app_banner_dismissed';

export function AppDownloadBanner() {
  const [dismissed, setDismissed] = useState(true);
  const [links, setLinks] = useState<{ appStoreUrl: string | null; playStoreUrl: string | null }>({ appStoreUrl: null, playStoreUrl: null });

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISS_KEY);
    setDismissed(!!wasDismissed);

    fetch('/api/app-store-links')
      .then(r => r.json())
      .then(setLinks)
      .catch(() => {});
  }, []);

  if (dismissed || (!links.appStoreUrl && !links.playStoreUrl)) return null;

  return (
    <div className="relative mx-4 mt-3 mb-1 px-4 py-3 bg-surface border border-border rounded-[var(--radius)] flex items-center gap-3">
      <Smartphone size={16} className="text-accent flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-[450] text-text">Get the ArguFight app</p>
        <p className="text-[13px] text-text-3 mt-0.5">
          Debate on the go — download ArguFight on your phone.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {links.appStoreUrl && (
          <a
            href={links.appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-[12px] font-[500] bg-accent text-[#0c0c0c] rounded-[var(--radius)] hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            App Store
          </a>
        )}
        {links.playStoreUrl && (
          <a
            href={links.playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-[12px] font-[500] bg-accent text-[#0c0c0c] rounded-[var(--radius)] hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Google Play
          </a>
        )}
      </div>
      <button
        onClick={() => { localStorage.setItem(DISMISS_KEY, 'true'); setDismissed(true); }}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-3 text-text-3 hover:text-text transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  );
}
