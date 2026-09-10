export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-primary pt-28 pb-24 px-4">
      <div className="max-w-[1150px] mx-auto space-y-6 animate-pulse">
        <div className="h-9 w-48 rounded-xl bg-white/5" />
        <div className="h-4 w-72 rounded bg-white/5" />
        <div className="grid sm:grid-cols-3 gap-4 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-3xl bg-white/[0.04] border border-white/5" />
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-white/[0.04] border border-white/5" />
          ))}
        </div>
      </div>
    </main>
  );
}
