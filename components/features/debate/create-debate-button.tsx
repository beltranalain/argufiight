'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/cn';

const CATEGORIES = [
  { value: 'POLITICS',      label: 'Politics' },
  { value: 'SCIENCE',       label: 'Science' },
  { value: 'TECH',          label: 'Technology' },
  { value: 'SPORTS',        label: 'Sports' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'MUSIC',         label: 'Music' },
  { value: 'OTHER',         label: 'Other' },
];

interface Props {
  label?: string;
  prefillTopic?: string;
  className?: string;
  variant?: 'dashed' | 'accent' | 'fab';
}

export function CreateDebateButton({ label = 'Start a debate', prefillTopic = '', className, variant = 'dashed' }: Props) {
  const router = useRouter();
  const [open, setOpen]           = useState(false);
  const [topic, setTopic]         = useState(prefillTopic);
  const [category, setCategory]   = useState('POLITICS');
  const [position, setPosition]   = useState<'FOR' | 'AGAINST'>('FOR');
  const [rounds, setRounds]       = useState(5);
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  // Opponent search state
  const [opponentQuery, setOpponentQuery] = useState('');
  const [opponentResults, setOpponentResults] = useState<{ id: string; username: string; avatarUrl: string | null; eloRating: number }[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<{ id: string; username: string; avatarUrl: string | null } | null>(null);
  const [searchingOpponent, setSearchingOpponent] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounced opponent search
  useEffect(() => {
    if (opponentQuery.length < 2) {
      setOpponentResults([]);
      setShowResults(false);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearchingOpponent(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(opponentQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setOpponentResults(data.users ?? []);
          setShowResults(true);
        }
      } catch { /* ignore */ }
      setSearchingOpponent(false);
    }, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [opponentQuery]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) { setError('Topic is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/debates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic:               topic.trim(),
          category,
          challengerPosition:  position,
          totalRounds:         rounds,
          challengeType:       selectedOpponent ? 'DIRECT' : 'OPEN',
          isPrivate:           selectedOpponent ? true : isPrivate,
          ...(selectedOpponent && { invitedUserIds: [selectedOpponent.id] }),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? 'Failed to create debate');
        return;
      }
      const debate = await res.json();
      setOpen(false);
      router.push(`/debate/${debate.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpen() {
    setTopic(prefillTopic);
    setError('');
    setSelectedOpponent(null);
    setOpponentQuery('');
    setOpponentResults([]);
    setShowResults(false);
    setOpen(true);
  }

  return (
    <>
      {variant === 'fab' ? (
        <button
          onClick={handleOpen}
          className={cn(
            'w-12 h-12 rounded-full bg-accent text-bg flex items-center justify-center shadow-lg shadow-[rgba(212,240,80,0.25)] active:scale-95 transition-transform cursor-pointer',
            className
          )}
          aria-label="Start a debate"
        >
          <span className="text-[28px] font-[300] leading-none">+</span>
        </button>
      ) : variant === 'accent' ? (
        <button
          onClick={handleOpen}
          className={cn(
            'bg-accent text-bg rounded-[20px] px-5 py-2 text-[15px] font-[600] tracking-[0.3px] hover:bg-accent-2 transition-colors cursor-pointer',
            className
          )}
        >
          {label}
        </button>
      ) : (
        <button
          onClick={handleOpen}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 border border-dashed border-border-2 rounded-[var(--radius)] hover:border-accent hover:bg-[rgba(212,240,80,0.03)] transition-colors group w-full cursor-pointer',
            className
          )}
        >
          <span className="text-[20px] text-accent font-[300] leading-none">+</span>
          <span className="flex-1 text-[15px] font-[500] text-text-3 group-hover:text-accent transition-colors text-left">
            {label}
          </span>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.7)] backdrop-blur-[2px]"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-surface border border-border rounded-[var(--radius)] w-full max-w-md mx-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <p className="text-[17px] font-[600] text-text">Start a debate</p>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-text-3 hover:text-text hover:border-border-2 transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

              {/* Topic */}
              <div>
                <label className="block text-[13px] font-[600] uppercase tracking-[1px] text-text-3 mb-1.5">
                  Topic
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Social media does more harm than good"
                  rows={2}
                  className="w-full bg-surface-2 border border-border rounded-[var(--radius)] px-3 py-2.5 text-[16px] text-text placeholder:text-text-3 focus:outline-none focus:border-border-2 resize-none transition-colors"
                  required
                />
              </div>

              {/* Challenge opponent (optional) */}
              <div>
                <label className="block text-[13px] font-[600] uppercase tracking-[1px] text-text-3 mb-1.5">
                  Challenge User <span className="font-[400] normal-case tracking-normal">(optional)</span>
                </label>
                {selectedOpponent ? (
                  <div className="flex items-center gap-2 bg-surface-2 border border-accent rounded-[var(--radius)] px-3 py-2">
                    <Avatar src={selectedOpponent.avatarUrl} fallback={selectedOpponent.username} size="xs" />
                    <span className="text-[15px] text-text flex-1">{selectedOpponent.username}</span>
                    <button
                      type="button"
                      onClick={() => { setSelectedOpponent(null); setOpponentQuery(''); }}
                      className="text-text-3 hover:text-text transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
                      <input
                        type="text"
                        value={opponentQuery}
                        onChange={(e) => setOpponentQuery(e.target.value)}
                        onFocus={() => opponentResults.length > 0 && setShowResults(true)}
                        onBlur={() => setTimeout(() => setShowResults(false), 200)}
                        placeholder="Search by username..."
                        className="w-full bg-surface-2 border border-border rounded-[var(--radius)] pl-8 pr-3 py-2 text-[15px] text-text placeholder:text-text-3 focus:outline-none focus:border-border-2 transition-colors"
                      />
                      {searchingOpponent && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-text-3 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    {showResults && opponentResults.length > 0 && (
                      <div ref={resultsRef} className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-[var(--radius)] shadow-lg max-h-[180px] overflow-y-auto">
                        {opponentResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setSelectedOpponent({ id: user.id, username: user.username, avatarUrl: user.avatarUrl });
                              setOpponentQuery('');
                              setShowResults(false);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-surface-2 transition-colors cursor-pointer text-left"
                          >
                            <Avatar src={user.avatarUrl} fallback={user.username} size="xs" />
                            <span className="text-[14px] text-text flex-1">{user.username}</span>
                            <span className="text-[12px] text-text-3">{user.eloRating} ELO</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {showResults && opponentResults.length === 0 && opponentQuery.length >= 2 && !searchingOpponent && (
                      <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-[var(--radius)] shadow-lg px-3 py-2">
                        <p className="text-[13px] text-text-3">No users found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Category + Position row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-[600] uppercase tracking-[1px] text-text-3 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-[var(--radius)] px-3 py-2 text-[15px] text-text focus:outline-none focus:border-border-2 transition-colors cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-[600] uppercase tracking-[1px] text-text-3 mb-1.5">
                    Your position
                  </label>
                  <div className="flex gap-1.5">
                    {(['FOR', 'AGAINST'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPosition(p)}
                        className={cn(
                          'flex-1 py-2 text-[14px] font-[500] rounded-[var(--radius)] border transition-colors cursor-pointer',
                          position === p
                            ? 'bg-accent text-bg border-accent'
                            : 'bg-surface-2 text-text-3 border-border hover:border-border-2'
                        )}
                      >
                        {p === 'FOR' ? 'For' : 'Against'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rounds */}
              <div>
                <label className="block text-[13px] font-[600] uppercase tracking-[1px] text-text-3 mb-1.5">
                  Rounds
                </label>
                <div className="flex gap-1.5">
                  {[3, 5, 7].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRounds(r)}
                      className={cn(
                        'flex-1 py-2 text-[15px] font-[500] rounded-[var(--radius)] border transition-colors cursor-pointer',
                        rounds === r
                          ? 'bg-accent text-bg border-accent'
                          : 'bg-surface-2 text-text-3 border-border hover:border-border-2'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <p className="text-[15px] font-[500] text-text">Private debate</p>
                  <p className="text-[13px] text-text-3">Only invited users can view</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrivate((v) => !v)}
                  className={cn(
                    'w-9 h-5 rounded-full border transition-colors cursor-pointer relative',
                    isPrivate ? 'bg-accent border-accent' : 'bg-surface-2 border-border'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-4 w-4 rounded-full transition-transform',
                      isPrivate ? 'translate-x-4 bg-bg' : 'translate-x-0.5 bg-text-3'
                    )}
                  />
                </button>
              </div>

              {error && (
                <p className="text-[14px] text-[var(--red)]">{error}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  loading={submitting}
                  disabled={!topic.trim()}
                  className="flex-1"
                >
                  Create debate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
