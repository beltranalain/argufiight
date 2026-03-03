export function PageLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0c0c0c]">
      <div className="flex flex-col items-center gap-5">
        <p
          className="text-[28px] font-[300] uppercase text-white animate-pulse"
          style={{ letterSpacing: '6px' }}
        >
          Argu<strong className="font-[600] text-accent">fight</strong>
        </p>
        <div className="h-[2px] w-16 rounded-full overflow-hidden bg-[#1c1c1c]">
          <div
            className="h-full w-full bg-accent rounded-full"
            style={{
              animation: 'loading-bar 1.2s ease-in-out infinite',
              transformOrigin: 'left',
            }}
          />
        </div>
      </div>
    </div>
  );
}
