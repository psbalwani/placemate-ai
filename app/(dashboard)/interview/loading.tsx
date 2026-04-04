export default function InterviewLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-44 rounded-lg bg-muted" />
        <div className="h-4 w-72 rounded-lg bg-muted" />
      </div>
      <div className="h-80 rounded-2xl bg-muted" />
    </div>
  );
}
