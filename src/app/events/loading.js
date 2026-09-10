export default function EventsLoading() {
  return (
    <main className="min-h-screen bg-primary pt-28 pb-24 px-4">
      <div className="max-w-[1240px] mx-auto space-y-6 animate-pulse">
        <div className="h-10 w-2/3 max-w-md mx-auto rounded-xl bg-white/5" />
        <div className="h-4 w-1/2 max-w-sm mx-auto rounded bg-white/5" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-3xl bg-white/[0.04] border border-white/5" />
          ))}
        </div>
      </div>
    </main>
  );
}
