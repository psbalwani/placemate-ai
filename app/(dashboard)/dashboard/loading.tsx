export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-pulse">
      {/* Greeting skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-lg bg-muted" />
          <div className="h-4 w-72 rounded-lg bg-muted" />
        </div>
        <div className="h-9 w-24 rounded-lg bg-muted" />
      </div>

      {/* Readiness + metrics skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-48 rounded-2xl bg-muted" />
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted" />
          ))}
        </div>
      </div>

      {/* Actions skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
