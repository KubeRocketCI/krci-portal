import * as React from "react";
import { Button } from "@/core/components/ui/button";

export interface ClusterFilterProps {
  /** Every cluster the list can be scoped to. */
  clusters: string[];
  selected: string[];
  stageClusters: string[];
  onChange: (clusters: string[]) => void;
}

/** Multi-select of clusters. The last selected cluster stays on: a list is scoped to one cluster at least. */
export function ClusterFilter({ clusters, selected, stageClusters, onChange }: ClusterFilterProps) {
  const labelId = React.useId();

  const toggle = (cluster: string) =>
    onChange(
      selected.includes(cluster)
        ? selected.filter((item) => item !== cluster)
        : [...selected, cluster].sort((a, b) => a.localeCompare(b))
    );

  return (
    <div className="flex flex-col gap-1">
      <span id={labelId} className="text-muted-foreground text-xs font-medium">
        Clusters
      </span>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-1">
        {clusters.map((cluster) => {
          const pressed = selected.includes(cluster);
          return (
            <Button
              key={cluster}
              size="sm"
              variant={pressed ? "default" : "outline"}
              aria-pressed={pressed}
              disabled={pressed && selected.length === 1}
              onClick={() => toggle(cluster)}
            >
              {cluster}
              {stageClusters.includes(cluster) && <span className="text-xs opacity-70"> (this installation)</span>}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
