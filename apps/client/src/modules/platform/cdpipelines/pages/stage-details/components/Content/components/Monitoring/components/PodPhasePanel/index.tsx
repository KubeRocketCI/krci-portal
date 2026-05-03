import * as React from "react";
import { Badge } from "@/core/components/ui/badge";
import { Card } from "@/core/components/ui/card";
import { POD_PHASE_BADGE_VARIANT } from "../../constants";
import type { PodPhasePanelProps } from "../../types";

export function PodPhasePanel({ data, selectedApps }: PodPhasePanelProps) {
  const visible = React.useMemo(
    () => (selectedApps ? data.filter((d) => selectedApps.has(d.app)) : data),
    [data, selectedApps]
  );
  const isEmpty = visible.every((entry) => entry.pods.length === 0);

  return (
    <Card className="p-4" data-tour="stage-monitoring-pod-phase">
      <div className="flex items-baseline justify-between">
        <h4 className="text-foreground text-base font-semibold">Pod status</h4>
        <span className="text-muted-foreground text-xs">current</span>
      </div>
      {isEmpty ? (
        <div className="text-muted-foreground mt-3 text-sm">No pod status available</div>
      ) : (
        <ul className="mt-3 space-y-3">
          {visible.map((entry) => (
            <li key={entry.app}>
              <div className="text-foreground mb-1 text-sm font-medium">{entry.app}</div>
              {entry.pods.length === 0 ? (
                <div className="text-muted-foreground text-xs">No pods</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {entry.pods.map((pod) => (
                    <Badge
                      key={pod.name}
                      variant={POD_PHASE_BADGE_VARIANT[pod.phase]}
                      title={pod.name}
                      className="text-[11px]"
                    >
                      <span className="max-w-[160px] truncate">{pod.name}</span>
                      <span className="ml-1.5 opacity-75">{pod.phase}</span>
                    </Badge>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
