'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';

interface CroData {
  croScore: number;
  funnel: {
    totalUsers: number;
    activatedUsers: number;
    activeSubscriptions: number;
    activationRate: number;
    paidConvRate: number;
  };
  debateMetrics: {
    totalDebates: number;
    completedDebates: number;
    debateCompRate: number;
    avgDebatesPerUser: number;
  };
  monthlyData: { month: string; signups: number; debates: number }[];
  recommendations: { priority: string; title: string; description: string }[];
  ctas: { page: string; cta: string; priority: string; status: string }[];
}

function ScoreGauge({ score }: { score: number }) {
  const color  = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--blue)' : score >= 40 ? 'var(--amber)' : 'var(--red)';
  const circ   = 2 * Math.PI * 40;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-24 h-24">
      <svg className="-rotate-90 w-24 h-24" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface-3)" strokeWidth="8" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-[300] text-text">{score}</span>
      </div>
    </div>
  );
}

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[14px]">
        <span className="text-text-2">{label}</span>
        <span className="text-text-3">{value.toLocaleString()} <span className="text-[12px]">({pct}%)</span></span>
      </div>
      <div className="h-5 bg-surface-3 rounded overflow-hidden">
        <div className="h-full flex items-center pl-2 rounded transition-all" style={{ width: `${Math.max(pct, 3)}%`, background: color }}>
          {pct > 15 && <span className="text-[12px] font-[500] text-white">{pct}%</span>}
        </div>
      </div>
    </div>
  );
}

function priorityBadge(p: string) {
  if (p === 'high')   return <span className="px-2 py-0.5 rounded text-[13px] font-[500] bg-[rgba(255,77,77,0.15)] text-[var(--red)]">High</span>;
  if (p === 'medium') return <span className="px-2 py-0.5 rounded text-[13px] font-[500] bg-[rgba(255,207,77,0.15)] text-[var(--amber)]">Medium</span>;
  return                     <span className="px-2 py-0.5 rounded text-[13px] font-[500] bg-[rgba(120,120,120,0.15)] text-text-3">Low</span>;
}

export default function CROTab() {
  const [data, setData]         = useState<CroData | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/seo-geo/cro')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-2 border-border border-t-accent animate-spin" />
      </div>
    );
  }
  if (!data) return null;

  const { funnel, debateMetrics, monthlyData } = data;
  const maxMonthlyVal = Math.max(...monthlyData.map((m) => Math.max(m.signups, m.debates)), 1);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-[600] text-text">Conversion Rate Optimization (CRO)</h2>
          <p className="text-[17px] text-text-3">Turn visitors into active debaters and paying subscribers</p>
        </div>
        <ScoreGauge score={data.croScore} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Activation Rate',   value: `${funnel.activationRate}%`,   sub: 'Users who debated',    color: funnel.activationRate >= 30 ? 'var(--green)' : 'var(--amber)' },
          { label: 'Paid Conv. Rate',   value: `${funnel.paidConvRate}%`,     sub: 'Free → subscriber',    color: funnel.paidConvRate >= 3    ? 'var(--green)' : 'var(--amber)' },
          { label: 'Debate Completion', value: `${debateMetrics.debateCompRate}%`, sub: 'Debates completed', color: debateMetrics.debateCompRate >= 60 ? 'var(--green)' : 'var(--amber)' },
          { label: 'Avg Debates/User',  value: debateMetrics.avgDebatesPerUser, sub: 'Engagement depth',   color: 'var(--text)' },
        ].map(({ label, value, sub, color }) => (
          <Card key={label} padding="md">
            <p className="text-2xl font-[300]" style={{ color }}>{value}</p>
            <p className="text-[15px] font-[500] text-text mt-1">{label}</p>
            <p className="text-[13px] text-text-3">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Conversion Funnel */}
      <Card padding="none">
        <div className="p-4 border-b border-border">
          <h3 className="text-[16px] font-[500] text-text">Conversion Funnel</h3>
          <p className="text-[15px] text-text-3 mt-0.5">User journey from signup to paid subscriber</p>
        </div>
        <div className="p-4 space-y-4">
          <FunnelBar label="Registered Users"  value={funnel.totalUsers}          total={funnel.totalUsers}          color="var(--blue)"   />
          <FunnelBar label="Activated (debated)" value={funnel.activatedUsers}    total={funnel.totalUsers}          color="var(--accent)" />
          <FunnelBar label="Paid Subscribers"  value={funnel.activeSubscriptions} total={funnel.totalUsers}          color="var(--green)"  />
        </div>
        <div className="px-4 pb-4 grid grid-cols-3 gap-3">
          <div className="p-3 bg-surface-2 rounded-[var(--radius)] text-center">
            <p className="text-xl font-[300] text-text">{funnel.totalUsers.toLocaleString()}</p>
            <p className="text-[13px] text-text-3">Total Users</p>
          </div>
          <div className="p-3 bg-surface-2 rounded-[var(--radius)] text-center">
            <p className="text-xl font-[300] text-text">{funnel.activatedUsers.toLocaleString()}</p>
            <p className="text-[13px] text-text-3">Activated</p>
          </div>
          <div className="p-3 bg-surface-2 rounded-[var(--radius)] text-center">
            <p className="text-xl font-[300] text-text">{funnel.activeSubscriptions.toLocaleString()}</p>
            <p className="text-[13px] text-text-3">Paid</p>
          </div>
        </div>
      </Card>

      {/* Monthly Trend */}
      <Card padding="none">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <TrendingUp size={16} className="text-accent" />
          <h3 className="text-[16px] font-[500] text-text">Monthly Trend — Last 6 Months</h3>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-[13px] font-[500] text-text-3 uppercase tracking-wide">Month</th>
                  <th className="text-right py-2 px-3 text-[13px] font-[500] text-text-3 uppercase tracking-wide">New Signups</th>
                  <th className="text-right py-2 px-3 text-[13px] font-[500] text-text-3 uppercase tracking-wide">New Debates</th>
                  <th className="text-right py-2 px-3 text-[13px] font-[500] text-text-3 uppercase tracking-wide">Signups Trend</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((m) => {
                  const barW = Math.round((m.signups / maxMonthlyVal) * 100);
                  return (
                    <tr key={m.month} className="border-b border-border/50">
                      <td className="py-2 px-3 text-text">{m.month}</td>
                      <td className="py-2 px-3 text-right text-text">{m.signups}</td>
                      <td className="py-2 px-3 text-right text-text">{m.debates}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${barW}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* CTA Audit */}
      <Card padding="none">
        <div className="p-4 border-b border-border">
          <h3 className="text-[16px] font-[500] text-text">CTA Audit</h3>
          <p className="text-[15px] text-text-3 mt-0.5">Key calls-to-action and their implementation status</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border">
                {['Page', 'CTA', 'Priority', 'Status'].map((h) => (
                  <th key={h} className="text-left py-2 px-4 text-[13px] font-[500] text-text-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.ctas.map((cta, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 px-4 text-text-2">{cta.page}</td>
                  <td className="py-2 px-4 text-text">{cta.cta}</td>
                  <td className="py-2 px-4">{priorityBadge(cta.priority)}</td>
                  <td className="py-2 px-4">
                    {cta.status === 'live'
                      ? <span className="flex items-center gap-1.5 text-[var(--green)]"><CheckCircle size={13} /> Live</span>
                      : <span className="flex items-center gap-1.5 text-[var(--amber)]"><XCircle size={13} /> Missing</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <Card padding="none">
          <div className="p-4 border-b border-border">
            <h3 className="text-[16px] font-[500] text-text">CRO Recommendations</h3>
          </div>
          <div className="divide-y divide-border">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="p-4 flex items-start gap-3">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-[var(--amber)]" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {priorityBadge(rec.priority)}
                    <span className="text-[15px] font-[500] text-text">{rec.title}</span>
                  </div>
                  <p className="text-[14px] text-text-3">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* CRO Guide */}
      <Card padding="md">
        <h3 className="text-[16px] font-[500] text-text mb-3">ArguFight CRO Framework</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { title: 'Activation Loop',       desc: 'Homepage → Sign up → Daily Challenge prompt → First debate started. Reducing steps increases activation.' },
            { title: 'Habit Formation',        desc: 'Streaks, daily challenges, and verdict notifications drive repeat visits and debate completions.' },
            { title: 'Upgrade Triggers',       desc: 'Show upgrade prompts at natural limits: 3 debates, leaderboard placement, tournament registration.' },
            { title: 'Social Proof',           desc: 'Leaderboard, ELO ratings, and win/loss stats motivate continued engagement and referrals.' },
          ].map(({ title, desc }) => (
            <div key={title} className="p-3 bg-surface-2 rounded-[var(--radius)]">
              <p className="text-[15px] font-[500] text-text mb-1">{title}</p>
              <p className="text-[14px] text-text-3">{desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
