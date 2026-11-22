// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import { Button } from "@/core/components/ui/button";

export interface ClusterFilterProps {
  /** Distinct `k8s-cluster` values of the products. */
  clusters: string[];
  selected: string[];
  /** Clusters of the installation's Stages. */
  installationClusters: string[];
  onChange: (clusters: string[]) => void;
}

/** Multi-select of clusters. The page starts with the clusters of the installation's Stages. */
export function ClusterFilter({ clusters, selected, installationClusters, onChange }: ClusterFilterProps) {
  const toggle = (cluster: string) => {
    onChange(selected.includes(cluster) ? selected.filter((item) => item !== cluster) : [...selected, cluster].sort());
  };

  return (
    <div className="flex flex-col gap-1" data-testid="cluster-filter">
      <span className="text-muted-foreground text-xs font-medium">Clusters</span>
      <div role="group" aria-label="Clusters" className="flex flex-wrap gap-1">
        {clusters.map((cluster) => (
          <Button
            key={cluster}
            size="sm"
            variant={selected.includes(cluster) ? "default" : "outline"}
            aria-pressed={selected.includes(cluster)}
            onClick={() => toggle(cluster)}
          >
            {cluster}
            {installationClusters.includes(cluster) && <span className="text-xs opacity-70">this installation</span>}
          </Button>
        ))}
        {clusters.length === 0 && <span className="text-muted-foreground text-sm">No cluster</span>}
      </div>
    </div>
  );
}
