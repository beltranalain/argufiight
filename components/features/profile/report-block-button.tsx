'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { MoreHorizontal, Flag, ShieldBan, X } from 'lucide-react';

const REPORT_REASONS = [
  'Spam or misleading',
  'Harassment or bullying',
  'Hate speech',
  'Inappropriate content',
  'Impersonation',
  'Other',
];

interface Props {
  targetId: string;
  targetName: string;
  currentUserId: string | null;
}

export function ReportBlockButton({ targetId, targetName, currentUserId }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'menu' | 'report'>('menu');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!currentUserId) return null;

  async function handleBlock() {
    if (!confirm(`Block ${targetName}? They won't be able to see your profile or interact with you. Their content will be hidden from your feed.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${targetId}/block`, { method: 'POST' });
      if (res.ok) {
        toast.success(`${targetName} has been blocked`);
        setOpen(false);
      } else {
        toast.error('Failed to block user');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReport() {
    if (!reason) return;
    setLoading(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description: description || undefined }),
      });
      if (res.ok) {
        toast.success('Report submitted. Our moderators will review it.');
        setOpen(false);
        setView('menu');
        setReason('');
        setDescription('');
      } else {
        toast.error('Failed to submit report');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => { setOpen(!open); setView('menu'); }}
        aria-label="More options"
      >
        <MoreHorizontal size={16} />
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setView('menu'); }} />

          <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
            {view === 'menu' ? (
              <>
                <button
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-surface-2 transition-colors"
                  onClick={() => setView('report')}
                >
                  <Flag size={16} className="text-red flex-shrink-0" />
                  <div>
                    <p className="text-[14px] font-[500] text-text">Report</p>
                    <p className="text-[12px] text-text-3">Flag this user for review</p>
                  </div>
                </button>
                <button
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-surface-2 transition-colors border-t border-border"
                  onClick={handleBlock}
                  disabled={loading}
                >
                  <ShieldBan size={16} className="text-red flex-shrink-0" />
                  <div>
                    <p className="text-[14px] font-[500] text-text">Block {targetName}</p>
                    <p className="text-[12px] text-text-3">Hide their content and prevent interactions</p>
                  </div>
                </button>
              </>
            ) : (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[14px] font-[500] text-text">Report {targetName}</p>
                  <button onClick={() => setView('menu')} className="text-text-3 hover:text-text">
                    <X size={14} />
                  </button>
                </div>
                <div className="flex flex-col gap-2 mb-3">
                  {REPORT_REASONS.map((r) => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer text-[13px] text-text">
                      <input
                        type="radio"
                        name="reason"
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="accent-accent"
                      />
                      {r}
                    </label>
                  ))}
                </div>
                <textarea
                  className="w-full text-[13px] bg-bg border border-border rounded-md p-2 text-text placeholder:text-text-3 resize-none mb-3"
                  rows={2}
                  placeholder="Additional details (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleReport}
                  loading={loading}
                  disabled={!reason}
                  className="w-full"
                >
                  Submit Report
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
