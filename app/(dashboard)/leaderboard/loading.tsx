export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-bg-secondary border-b border-bg-tertiary z-50" />

      <div className="pt-16 md:pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-4xl mx-auto animate-pulse">
          {/* Title */}
          <div className="h-8 w-48 bg-bg-tertiary rounded mt-8 mb-6" />
          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <div className="h-10 w-24 bg-bg-tertiary rounded" />
            <div className="h-10 w-32 bg-bg-tertiary rounded" />
          </div>
          {/* Table rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b border-bg-tertiary">
              <div className="h-6 w-8 bg-bg-tertiary rounded" />
              <div className="h-10 w-10 bg-bg-tertiary rounded-full" />
              <div className="h-5 w-32 bg-bg-tertiary rounded" />
              <div className="ml-auto h-5 w-16 bg-bg-tertiary rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
