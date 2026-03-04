export function ListingSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 animate-pulse">
      <div className="flex-shrink-0 h-11 w-11 rounded-lg bg-secondary" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 rounded bg-secondary" />
          <div className="h-4 w-14 rounded bg-secondary" />
        </div>
        <div className="mt-2 h-3.5 w-48 rounded bg-secondary" />
        <div className="mt-2.5 flex items-center gap-3">
          <div className="h-3 w-24 rounded bg-secondary" />
          <div className="h-3 w-16 rounded bg-secondary" />
        </div>
      </div>
    </div>
  );
}
