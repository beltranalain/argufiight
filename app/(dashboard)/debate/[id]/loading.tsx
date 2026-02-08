export default function DebateLoading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-bg-secondary border-b border-bg-tertiary z-50" />

      <div className="pt-16 md:pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-4xl mx-auto animate-pulse">
          {/* Debate header */}
          <div className="bg-bg-secondary rounded-xl border border-bg-tertiary p-6 mt-8 space-y-4">
            <div className="h-7 w-2/3 bg-bg-tertiary rounded" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-bg-tertiary rounded-full" />
                <div className="h-4 w-20 bg-bg-tertiary rounded" />
              </div>
              <div className="h-4 w-8 bg-bg-tertiary rounded" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-bg-tertiary rounded-full" />
                <div className="h-4 w-20 bg-bg-tertiary rounded" />
              </div>
            </div>
          </div>
          {/* Statements */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-bg-secondary rounded-xl border border-bg-tertiary p-6 mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-bg-tertiary rounded-full" />
                <div className="h-4 w-24 bg-bg-tertiary rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-bg-tertiary rounded" />
                <div className="h-4 w-5/6 bg-bg-tertiary rounded" />
                <div className="h-4 w-3/4 bg-bg-tertiary rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
