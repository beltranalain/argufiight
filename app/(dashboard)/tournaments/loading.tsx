export default function TournamentsLoading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-bg-secondary border-b border-bg-tertiary z-50" />

      <div className="pt-16 md:pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="flex items-center justify-between mt-8 mb-6">
            <div className="h-8 w-40 bg-bg-tertiary rounded" />
            <div className="h-10 w-36 bg-bg-tertiary rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-bg-secondary rounded-xl border border-bg-tertiary p-6 space-y-4">
                <div className="h-6 w-3/4 bg-bg-tertiary rounded" />
                <div className="h-4 w-full bg-bg-tertiary rounded" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-bg-tertiary rounded-full" />
                  <div className="h-6 w-20 bg-bg-tertiary rounded-full" />
                </div>
                <div className="h-10 w-full bg-bg-tertiary rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
