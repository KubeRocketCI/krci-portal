import { useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Layers, Shield } from "lucide-react";
import { Stage, applicationHealthStatus, getApplicationStatus } from "@my-project/shared";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/utils/classname";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { useStageArgoApplicationListWatch } from "../../hooks/data";
import { usePipelineAppCodebases, useArgoAppsByAppName } from "../../hooks/usePipelineData";
import { routeCDPipelineDetails } from "../../route";

interface PipelineEnvironmentCardProps {
  stage: Stage;
  isSelected: boolean;
}

export function PipelineEnvironmentCard({ stage, isSelected }: PipelineEnvironmentCardProps) {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const navigate = useNavigate();
  const params = routeCDPipelineDetails.useParams();
  const search = routeCDPipelineDetails.useSearch();

  // Fetch data needed for health calculation
  const stageArgoAppsWatch = useStageArgoApplicationListWatch(stage.spec.name);
  const { data: pipelineAppCodebases } = usePipelineAppCodebases();
  const argoAppsByAppName = useArgoAppsByAppName(stageArgoAppsWatch.data.array);

  const linkParams = {
    clusterName,
    cdPipeline: params.name,
    namespace: params.namespace,
    stage: stage.spec.name,
  };

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

    if (statuses.length === 0) return "unknown";
    if (statuses.includes(applicationHealthStatus.degraded)) return "degraded";
    if (statuses.includes(applicationHealthStatus.progressing)) return "progressing";
    if (statuses.every((s) => s === applicationHealthStatus.healthy)) return "healthy";
    return "unknown";
  }, [pipelineAppCodebases, argoAppsByAppName]);

  const healthDotColor = {
    healthy: STATUS_COLOR.SUCCESS,
    degraded: STATUS_COLOR.ERROR,
    progressing: STATUS_COLOR.IN_PROGRESS,
    unknown: STATUS_COLOR.UNKNOWN,
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
        <div className="absolute top-5 right-5 size-2.5 rounded-full" style={{ backgroundColor: healthDotColor }} />

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

          <button
            className="text-foreground mb-1 h-auto p-0 text-sm font-semibold hover:underline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate({ to: PATH_CDPIPELINE_STAGE_DETAILS_FULL, params: linkParams });
            }}
          >
            {stage.spec.name}
          </button>
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
