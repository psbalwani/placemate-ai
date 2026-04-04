export default function RoadmapLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg bg-muted" />
          <div className="h-4 w-64 rounded-lg bg-muted" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-muted" />
      </div>
      <div className="h-20 rounded-2xl bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
