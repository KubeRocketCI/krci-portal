import * as React from "react";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import type { StatPanelProps } from "../types";
import { chartSlug, formatPercent } from "../utils";

export const StatPanel = React.memo(function StatPanel({
  title,
  value,
  isLoading,
  error,
  format = formatPercent,
  suffix = "%",
  tourPrefix = "metrics",
}: StatPanelProps) {
  return (
    <Card className="p-4" data-tour={`${tourPrefix}-${chartSlug(title)}`}>
      <h4 className="text-foreground text-sm font-semibold">{title}</h4>
      <div className="mt-2 flex h-24 items-center justify-center">
        {isLoading && <LoadingSpinner />}
        {!isLoading && error && <div className="text-destructive text-sm">{error.message}</div>}
        {!isLoading && !error && value === null && (
          <div className="text-muted-foreground text-3xl font-light tracking-tight">No data</div>
        )}
        {!isLoading && !error && value !== null && (
          <div className="text-foreground text-5xl font-light tracking-tight tabular-nums">
            {format(value)}
            {suffix && <span className="text-muted-foreground ml-1 text-2xl">{suffix}</span>}
          </div>
        )}
      </div>
    </Card>
  );
});
