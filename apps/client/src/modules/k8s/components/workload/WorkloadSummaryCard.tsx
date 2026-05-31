import { Card } from "@/core/components/ui/card";

interface WorkloadSummaryCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}

/**
 * A single stat tile used in the workload overview summary grid.
 * Promoted from the Pod detail page's local `SummaryCard` so every workload
 * (Deployment, StatefulSet, DaemonSet, Job, CronJob, …) renders identical tiles.
 */
export function WorkloadSummaryCard({ label, value, sub }: WorkloadSummaryCardProps) {
  return (
    <Card className="flex min-w-0 flex-col gap-1 p-3">
      <div className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</div>
      <div className="text-foreground min-w-0 truncate text-sm font-medium">{value}</div>
      {sub !== undefined && <div className="text-muted-foreground truncate text-xs">{sub}</div>}
    </Card>
  );
}

/** Responsive 2/3/6-column grid wrapper for {@link WorkloadSummaryCard} tiles. */
export function WorkloadSummaryGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{children}</div>;
}
