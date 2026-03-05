import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Layers, Shield } from "lucide-react";
import { Stage, applicationLabels, applicationHealthStatus, getApplicationStatus } from "@my-project/shared";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/utils/classname";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { useCDPipelineWatch, useAppCodebaseListWatch, useStageArgoApplicationListWatch } from "../../hooks/data";
import { routeCDPipelineDetails } from "../../route";

interface PipelineEnvironmentCardProps {
  stage: Stage;
  isSelected: boolean;
}

export function PipelineEnvironmentCard({ stage, isSelected }: PipelineEnvironmentCardProps) {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const params = routeCDPipelineDetails.useParams();
  const search = routeCDPipelineDetails.useSearch();

  // Fetch data needed for health calculation
  const cdPipelineWatch = useCDPipelineWatch();
  const appCodebaseListWatch = useAppCodebaseListWatch();
  const stageArgoAppsWatch = useStageArgoApplicationListWatch(stage.spec.name);

  const linkParams = {
    clusterName,
    cdPipeline: params.name,
    namespace: params.namespace,
    stage: stage.spec.name,
  };

  // Filter codebases to only those in the pipeline
  const pipelineAppCodebases = useMemo(() => {
    const cdPipeline = cdPipelineWatch.data;
    if (!cdPipeline) return [];

    return appCodebaseListWatch.data.array.filter((appCodebase) =>
      cdPipeline.spec.applications.some((appName) => appName === appCodebase.metadata.name)
    );
  }, [cdPipelineWatch.data, appCodebaseListWatch.data.array]);

  // Create a map of Argo applications by app name
  const stageArgoApps = stageArgoAppsWatch.data.array;
  const argoAppsByAppName = useMemo(() => {
    const map = new Map<string, (typeof stageArgoApps)[number]>();
    for (const app of stageArgoApps) {
      const appName = app.metadata?.labels?.[applicationLabels.appName];
      if (appName) {
        map.set(appName, app);
      }
    }
    return map;
  }, [stageArgoApps]);

  // Calculate overall health
  const overallHealth = useMemo(() => {
    const statuses: string[] = [];
    for (const appCodebase of pipelineAppCodebases) {
      const argoApp = argoAppsByAppName.get(appCodebase.metadata.name);
      if (!argoApp) {
        statuses.push(applicationHealthStatus.missing);
        continue;
      }
      const healthStatus = getApplicationStatus(argoApp);
      statuses.push(healthStatus.status?.toLowerCase() || applicationHealthStatus.missing);
    }

    if (statuses.includes(applicationHealthStatus.degraded)) return "degraded";
    if (statuses.includes(applicationHealthStatus.progressing)) return "progressing";
    if (statuses.every((s) => s === applicationHealthStatus.healthy)) return "healthy";
    return "unknown";
  }, [pipelineAppCodebases, argoAppsByAppName]);

  // Health dot styling
  const healthDotClass = {
    healthy: "bg-green-500",
    degraded: "bg-red-500",
    progressing: "bg-blue-500",
    unknown: "bg-slate-400",
  }[overallHealth];

  const qualityGates = stage.spec.qualityGates || [];

  return (
    <Button
      variant="ghost"
      asChild
      className={cn(
        "relative flex h-auto w-52 flex-shrink-0 flex-col items-start rounded-2xl border-2 p-4",
        isSelected
          ? "border-primary bg-primary/5 shadow-lg"
          : "border-border bg-card hover:border-border/80 hover:bg-card hover:shadow-md"
      )}
    >
      <Link to={routeCDPipelineDetails.fullPath} params={params} search={{ ...search, environment: stage.spec.name }}>
        {/* Health dot indicator */}
        <div className={cn("absolute top-5 right-5 size-2.5 rounded-full", healthDotClass)} />

        {/* Icon + name */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "mb-3 flex size-8 items-center justify-center rounded-xl",
              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            <Layers className="size-4" />
          </div>

          <Button variant="link" asChild className="text-foreground mb-1 h-auto p-0 text-sm font-semibold">
            <Link to={PATH_CDPIPELINE_STAGE_DETAILS_FULL} params={linkParams}>
              {stage.spec.name}
            </Link>
          </Button>
        </div>
        <div className="text-muted-foreground mt-0.5 mb-3 line-clamp-2 text-start text-xs whitespace-normal">
          {stage.spec.description || "No description"}
        </div>

        <div className="text-muted-foreground border-border mt-3 flex w-full items-center justify-between border-t pt-3 text-xs">
          <span className="flex items-center gap-1">
            <Shield className="size-3" /> {qualityGates.length} quality gates
          </span>
        </div>
      </Link>
    </Button>
  );
}
