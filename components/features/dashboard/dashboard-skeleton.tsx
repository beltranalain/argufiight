function Bone({ w, h = 14, className = '' }: { w?: string; h?: number; className?: string }) {
  return (
    <div
      className={`skeleton flex-shrink-0 ${className}`}
      style={{ width: w ?? '100%', height: h }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="px-7 py-6 min-w-0">

      {/* ── Daily Challenge ── */}
      <div className="mb-8 pb-8 border-b border-border">
        <p className="text-[13px] font-[600] uppercase tracking-[2px] text-text-3 mb-2">
          Daily Challenge
        </p>
        <Bone w="88%" h={34} className="mb-2" />
        <Bone w="64%" h={34} className="mb-4" />
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[15px] text-text-3">Community debate</span>
          <span className="text-border-2">/</span>
          <span className="text-[15px] text-text-3">Open for discussion</span>
          <span className="text-border-2">/</span>
          <Bone w="68px" h={20} className="rounded-[20px]" />
        </div>
        <Bone w="130px" h={32} className="rounded-[20px]" />
      </div>

      {/* ── Open Challenges ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-[600] uppercase tracking-[1.5px] text-text-3">
            Open Challenges
          </span>
          <span className="text-[13px] font-[500] text-text-3">View All</span>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 py-3 border-b border-border first:border-t first:border-border">
            <Bone w="18px" h={11} />
            <Bone w="64px" h={10} />
            <Bone h={13} className="flex-1" />
            <Bone w="65px" h={11} />
            <Bone w="28px" h={11} />
            <Bone w="56px" h={24} className="rounded-[20px]" />
          </div>
        ))}
      </div>

      {/* ── Live Debates ── */}
      <div className="flex gap-6 border-b border-border mb-3.5">
        <span className="text-[13px] font-[500] text-text-3 mb-3 pb-1">Live</span>
        <span className="text-[13px] font-[500] text-text-3 mb-3 pb-1">Trending</span>
        <span className="text-[13px] font-[500] text-text-3 mb-3 pb-1">Following</span>
      </div>
      <div className="flex gap-1.5 flex-wrap mb-4">
        {[38, 60, 56, 76, 56, 98, 50, 46].map((w, i) => (
          <Bone key={i} w={`${w}px`} h={22} className="rounded-[20px]" />
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="py-3 border-b border-border grid gap-2" style={{ gridTemplateColumns: '1fr auto' }}>
          <div>
            <Bone w="72px" h={10} className="mb-2" />
            <div className="flex items-center gap-2 mb-2">
              <Bone w="28px" h={28} className="rounded-full" />
              <Bone w="16px" h={10} />
              <Bone w="28px" h={28} className="rounded-full" />
            </div>
            <Bone w={`${60 + (i % 3) * 10}%`} h={13} />
          </div>
          <div className="flex flex-col items-end gap-1.5 justify-center">
            <Bone w="50px" h={20} className="rounded-[20px]" />
            <Bone w="68px" h={10} />
          </div>
        </div>
      ))}
    </div>
  );
}
