import { useMemo } from "react";
import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useCDPipelineWatchList } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useStageWatchList } from "@/k8s/api/groups/KRCI/Stage";
import { useApplicationWatchList } from "@/k8s/api/groups/ArgoCD/Application";
import { useClusterStore } from "@/k8s/store";
import {
  applicationLabels,
  applicationHealthStatus,
  getApplicationStatus,
  type Application,
  type Stage,
} from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { PATH_CDPIPELINES_FULL } from "@/modules/platform/cdpipelines/pages/list/route";
import { routeCDPipelineDetails } from "@/modules/platform/cdpipelines/pages/details/route";
import {
  Rocket,
  Loader2,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  Ghost,
  ShieldQuestion,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";

type HealthColor = "green" | "yellow" | "blue" | "gray" | "red";

interface StageNode {
  name: string;
  appVersions: Array<{
    appName: string;
    version: string | null;
    healthStatus: string;
    color: HealthColor;
  }>;
  healthySummary: { healthy: number; total: number };
}

interface PipelineFlow {
  pipelineName: string;
  applications: string[];
  stages: StageNode[];
}

const healthColorMap: Record<string, HealthColor> = {
  [applicationHealthStatus.healthy]: "green",
  [applicationHealthStatus.progressing]: "blue",
  [applicationHealthStatus.degraded]: "red",
  [applicationHealthStatus.suspended]: "yellow",
  [applicationHealthStatus.missing]: "gray",
};

const dotColorClass: Record<HealthColor, string> = {
  green: "bg-green-500",
  yellow: "bg-amber-500",
  blue: "bg-blue-500",
  gray: "bg-slate-300 dark:bg-slate-600",
  red: "bg-red-500",
};

const stageHealthBorder: Record<HealthColor, string> = {
  green: "border-green-200 dark:border-green-800",
  yellow: "border-amber-200 dark:border-amber-800",
  blue: "border-blue-200 dark:border-blue-800",
  gray: "border-border",
  red: "border-red-200 dark:border-red-800",
};

const HealthIconMap: Record<string, typeof CheckCircle> = {
  [applicationHealthStatus.healthy]: CheckCircle,
  [applicationHealthStatus.degraded]: AlertTriangle,
  [applicationHealthStatus.progressing]: PlayCircle,
  [applicationHealthStatus.missing]: Ghost,
};

function getOverallStageColor(stages: StageNode["appVersions"]): HealthColor {
  if (stages.length === 0) return "gray";
  if (stages.some((s) => s.color === "red")) return "red";
  if (stages.some((s) => s.color === "yellow")) return "yellow";
  if (stages.some((s) => s.color === "blue")) return "blue";
  if (stages.every((s) => s.color === "green")) return "green";
  return "gray";
}

function StageCard({ stage }: { stage: StageNode }) {
  const overallColor = getOverallStageColor(stage.appVersions);
  const { healthy, total } = stage.healthySummary;
  const allHealthy = healthy === total && total > 0;

  return (
    <Tooltip
      title={
        <div className="space-y-1">
          {stage.appVersions.map((app) => {
            const Icon = HealthIconMap[app.healthStatus] ?? ShieldQuestion;
            return (
              <div key={app.appName} className="flex items-center gap-2 text-xs">
                <Icon className="size-3" />
                <span className="font-medium">{app.appName}</span>
                <span className="font-mono">{app.version ?? "—"}</span>
              </div>
            );
          })}
        </div>
      }
    >
      <div
        className={`hover:bg-muted/50 flex min-w-[100px] cursor-default flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors ${stageHealthBorder[overallColor]}`}
      >
        <div className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${dotColorClass[overallColor]}`} />
          <span className="text-foreground text-sm font-medium capitalize">{stage.name}</span>
        </div>
        <Badge variant={allHealthy ? "success" : total === 0 ? "neutral" : "warning"} className="text-[10px]">
          {healthy}/{total} healthy
        </Badge>
      </div>
    </Tooltip>
  );
}

function PipelineFlowRow({
  flow,
  clusterName,
  namespace,
}: {
  flow: PipelineFlow;
  clusterName: string;
  namespace: string;
}) {
  return (
    <div className="hover:bg-muted/30 rounded-lg border p-4 transition-colors">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="text-muted-foreground size-4 shrink-0" />
          <Link to={routeCDPipelineDetails.fullPath} params={{ clusterName, name: flow.pipelineName, namespace }}>
            <Button variant="link" size="sm" className="h-auto p-0 text-sm font-medium">
              {flow.pipelineName}
            </Button>
          </Link>
          <Badge variant="neutral" className="text-[10px]">
            {flow.applications.length} {flow.applications.length === 1 ? "app" : "apps"}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {flow.stages.map((stage, idx) => (
          <div key={stage.name} className="flex items-center gap-2">
            <StageCard stage={stage} />
            {idx < flow.stages.length - 1 && <ChevronRight className="text-muted-foreground size-4 shrink-0" />}
          </div>
        ))}
        {flow.stages.length === 0 && <p className="text-muted-foreground text-sm">No stages configured</p>}
      </div>
    </div>
  );
}

export function EnvironmentMatrix() {
  const cdPipelineListWatch = useCDPipelineWatchList();
  const stageListWatch = useStageWatchList();
  const applicationListWatch = useApplicationWatchList();

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({ clusterName: state.clusterName, defaultNamespace: state.defaultNamespace }))
  );

  // Optimize memoization by splitting into smaller chunks to avoid full rebuild on every change
  const appsByKey = useMemo(() => {
    const map = new Map<string, Application>();
    for (const app of applicationListWatch.data.array) {
      const appName = app.metadata?.labels?.[applicationLabels.appName];
      const stageName = app.metadata?.labels?.[applicationLabels.stage];
      if (appName && stageName) {
        map.set(`${appName}::${stageName}`, app);
      }
    }
    return map;
  }, [applicationListWatch.data.array]);

  const stagesByPipeline = useMemo(() => {
    const map = new Map<string, Stage[]>();
    for (const stage of stageListWatch.data.array) {
      const pipeline = stage.spec.cdPipeline;
      if (!map.has(pipeline)) {
        map.set(pipeline, []);
      }
      map.get(pipeline)!.push(stage);
    }
    // Sort stages by order
    for (const [, pipelineStages] of map) {
      pipelineStages.sort((a, b) => a.spec.order - b.spec.order);
    }
    return map;
  }, [stageListWatch.data.array]);

  const pipelineFlows = useMemo(() => {
    return cdPipelineListWatch.data.array
      .map((cdPipeline): PipelineFlow => {
        const pipelineStages = stagesByPipeline.get(cdPipeline.spec.name) ?? [];

        const stageNodes: StageNode[] = pipelineStages.map((stage) => {
          const appVersions = cdPipeline.spec.applications.map((appName) => {
            const argoApp = appsByKey.get(`${appName}::${stage.spec.name}`);

            if (!argoApp) {
              return { appName, version: null, healthStatus: "missing", color: "gray" as HealthColor };
            }

            const version = argoApp.spec?.source?.targetRevision;
            const displayVersion = version === "build/NaN" ? null : (version ?? null);
            const { status } = getApplicationStatus(argoApp);
            const color = healthColorMap[status] ?? "gray";

            return { appName, version: displayVersion, healthStatus: status, color };
          });

          const healthy = appVersions.filter((v) => v.color === "green").length;

          return {
            name: stage.spec.name,
            appVersions,
            healthySummary: { healthy, total: appVersions.length },
          };
        });

        return {
          pipelineName: cdPipeline.spec.name,
          applications: cdPipeline.spec.applications,
          stages: stageNodes,
        };
      })
      .sort((a, b) => a.pipelineName.localeCompare(b.pipelineName));
  }, [cdPipelineListWatch.data.array, appsByKey, stagesByPipeline]);

  const isLoading =
    (cdPipelineListWatch.query.isFetching && !cdPipelineListWatch.query.data) ||
    (stageListWatch.query.isFetching && !stageListWatch.query.data) ||
    (applicationListWatch.query.isFetching && !applicationListWatch.query.data);

  if (!isLoading && pipelineFlows.length === 0) return null;

  return (
    <Card className="border">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-foreground mb-1 text-base font-medium">Deployment Flows</h2>
            <p className="text-muted-foreground text-sm">CD pipeline stages and application health</p>
          </div>
          <Link to={PATH_CDPIPELINES_FULL} params={{ clusterName }}>
            <Button variant="ghost" size="sm" className="text-primary h-auto p-0 text-sm">
              View All
              <ArrowRight className="ml-1 size-3.5" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
            <span className="text-muted-foreground ml-2 text-sm">Loading...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {pipelineFlows.map((flow) => (
              <PipelineFlowRow
                key={flow.pipelineName}
                flow={flow}
                clusterName={clusterName}
                namespace={defaultNamespace}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
