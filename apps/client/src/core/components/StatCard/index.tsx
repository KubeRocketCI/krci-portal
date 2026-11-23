import type { ReactNode } from "react";
import { AlertCircle, ArrowRight, CircleCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";
import { cn } from "@/core/utils/classname";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  loading?: boolean;
  /** `error`: the value in the error colour with StatErrorIcon. */
  tone?: "error";
  /** The line under the value, hidden while loading. */
  detail?: ReactNode;
}

/** The hover arrow needs a `group` ancestor: wrap the card in `<Link className="group block">`. */
export function StatCard({ icon: Icon, label, value, loading = false, tone, detail }: StatCardProps) {
  return (
    <Card className="hover:border-primary/40 h-full transition-colors">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="bg-muted rounded-md p-2">
          <Icon className="text-muted-foreground h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-12" />
          ) : (
            <p
              className={cn(
                "flex items-center gap-1.5 text-2xl font-semibold tabular-nums",
                tone === "error" && "text-status-error"
              )}
            >
              {value}
              {tone === "error" && <StatErrorIcon className="h-4 w-4" />}
            </p>
          )}
          {!loading && detail}
        </div>
        <ArrowRight
          className="text-muted-foreground/0 group-hover:text-muted-foreground mt-1 h-4 w-4 shrink-0 transition-colors"
          aria-hidden
        />
      </CardContent>
    </Card>
  );
}

/** Marks a value in the error colour for readers who do not see the colour; its label is in the accessible name. */
export function StatErrorIcon({ className }: { className?: string }) {
  return <AlertCircle role="img" aria-label="Needs attention" className={cn("shrink-0", className)} />;
}

interface StatHealthLineProps {
  ok: boolean;
  okText: string;
  badText: string;
  /** Default `error`. `warning`: a state that can clear on its own. */
  badTone?: "error" | "warning";
}

export function StatHealthLine({ ok, okText, badText, badTone = "error" }: StatHealthLineProps) {
  return ok ? (
    <span className="text-status-success mt-1 flex items-center gap-1 text-xs">
      <CircleCheck className="h-3.5 w-3.5" aria-hidden />
      {okText}
    </span>
  ) : (
    <span
      className={cn(
        "mt-1 flex items-center gap-1 text-xs",
        badTone === "warning" ? "text-status-missing" : "text-status-error"
      )}
    >
      <AlertCircle className="h-3.5 w-3.5" aria-hidden />
      {badText}
    </span>
  );
}

export function StatSubLine({ children }: { children: ReactNode }) {
  return <span className="text-muted-foreground mt-1 block text-xs">{children}</span>;
}
