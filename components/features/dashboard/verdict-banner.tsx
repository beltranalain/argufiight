'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

interface VerdictBannerProps {
  debate: {
    id: string;
    topic: string;
    winnerId: string | null;
  };
  userId: string;
}

export function VerdictBanner({ debate, userId }: VerdictBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isWin  = debate.winnerId === userId;
  const isTie  = debate.winnerId === null;
  const resultLabel  = isTie ? 'Tie' : isWin ? 'You won'  : 'You lost';
  const resultColor  = isTie ? 'var(--blue)' : isWin ? 'var(--green)' : 'var(--red)';
  const bgColor      = isTie ? 'rgba(77,159,255,0.04)' : isWin ? 'rgba(77,255,145,0.04)' : 'rgba(255,77,77,0.04)';
  const borderColor  = isTie ? 'rgba(77,159,255,0.2)'  : isWin ? 'rgba(77,255,145,0.2)'  : 'rgba(255,77,77,0.2)';

  async function handleDismiss() {
    setDismissed(true);
    await fetch(`/api/debates/${debate.id}/dismiss-verdict`, { method: 'POST' });
  }

  return (
    <div
      className="flex items-center gap-4 rounded-[var(--radius)] mb-4"
      style={{ padding: '9px 16px', background: bgColor, border: `1px solid ${borderColor}` }}
    >
      <div
        className="flex-shrink-0 rounded-full"
        style={{ width: 6, height: 6, background: resultColor, animation: 'pulse 1.5s ease-in-out infinite' }}
      />
      <span className="text-[14px] font-[600] tracking-[0.5px] whitespace-nowrap flex-shrink-0" style={{ color: resultColor }}>
        Verdict Ready
      </span>
      <span className="text-text-3 flex-shrink-0 text-[16px]">/</span>
      <span className="text-[15px] text-text-2 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        &quot;{debate.topic}&quot;
      </span>
      <span className="text-[14px] font-[600] flex-shrink-0 mr-2" style={{ color: resultColor }}>
        {resultLabel}
      </span>
      <Link
        href={`/debate/${debate.id}?tab=verdict`}
        className="flex-shrink-0 rounded-[20px] px-4 py-1.5 text-[14px] font-[600] tracking-[0.3px] transition-colors whitespace-nowrap text-white"
        style={{ background: resultColor }}
        onClick={handleDismiss}
      >
        View Verdict
      </Link>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-text-3 hover:text-text-2 hover:bg-surface-2 transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}
