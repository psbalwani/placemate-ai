export default function ResumeLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-52 rounded-lg bg-muted" />
        <div className="h-4 w-80 rounded-lg bg-muted" />
      </div>
      <div className="h-96 rounded-2xl bg-muted" />
    </div>
  );
}
