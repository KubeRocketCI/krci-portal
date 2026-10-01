/** Number of rows the table shows after filters. */
export function VisibleRunCount({ count }: { count: number }) {
  return (
    <p className="text-muted-foreground text-sm" data-testid="pipeline-run-count" aria-live="polite">
      <span className="text-foreground font-medium tabular-nums">{count}</span> {count === 1 ? "run" : "runs"}
    </p>
  );
}
