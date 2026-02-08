export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-bg-secondary border-b border-bg-tertiary z-50" />

      <div className="pt-16 md:pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-10 w-32 bg-bg-tertiary rounded mt-8 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-bg-secondary rounded-xl border border-bg-tertiary overflow-hidden">
                <div className="h-48 bg-bg-tertiary" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-3/4 bg-bg-tertiary rounded" />
                  <div className="h-4 w-full bg-bg-tertiary rounded" />
                  <div className="h-4 w-2/3 bg-bg-tertiary rounded" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-bg-tertiary rounded-full" />
                    <div className="h-5 w-20 bg-bg-tertiary rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
