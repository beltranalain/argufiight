export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-bg-secondary border-b border-bg-tertiary z-50" />

      <div className="pt-16 md:pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-8 w-32 bg-bg-tertiary rounded mt-8 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Conversation list */}
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl border border-bg-tertiary">
                  <div className="h-10 w-10 bg-bg-tertiary rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-bg-tertiary rounded" />
                    <div className="h-3 w-40 bg-bg-tertiary rounded" />
                  </div>
                </div>
              ))}
            </div>
            {/* Message area */}
            <div className="md:col-span-2 bg-bg-secondary rounded-xl border border-bg-tertiary h-[500px]" />
          </div>
        </div>
      </div>
    </div>
  )
}
