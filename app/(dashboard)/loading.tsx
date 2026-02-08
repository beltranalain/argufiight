export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* TopNav skeleton */}
      <div className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-bg-secondary border-b border-bg-tertiary z-50" />

      <div className="pt-16 md:pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="space-y-6">
              <div className="bg-bg-secondary rounded-xl border border-bg-tertiary mt-8 h-64" />
              <div className="bg-bg-secondary rounded-xl border border-bg-tertiary h-96" />
            </div>
            <div className="space-y-6">
              <div className="bg-bg-secondary rounded-xl border border-bg-tertiary mt-8 h-80" />
              <div className="bg-bg-secondary rounded-xl border border-bg-tertiary h-64" />
            </div>
            <div className="space-y-6">
              <div className="bg-bg-secondary rounded-xl border border-bg-tertiary mt-8 h-64" />
              <div className="bg-bg-secondary rounded-xl border border-bg-tertiary h-48" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
