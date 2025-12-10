import { useMemo } from "react";
import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Stage, applicationLabels, applicationHealthStatus, getApplicationStatus } from "@my-project/shared";
import { useCDPipelineWatch, useAppCodebaseListWatch, useStageArgoApplicationListWatch } from "../../../hooks/data";

interface HealthSummaryProps {
  stage: Stage;
}

export const HealthSummary = ({ stage }: HealthSummaryProps) => {
  // Fetch data needed for health calculation
  const cdPipelineWatch = useCDPipelineWatch();
  const appCodebaseListWatch = useAppCodebaseListWatch();
  const stageArgoAppsWatch = useStageArgoApplicationListWatch(stage.spec.name);

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

  // Calculate health summary
  const healthSummary = useMemo(() => {
    const summary = { healthy: 0, progressing: 0, degraded: 0, missing: 0 };
    for (const appCodebase of pipelineAppCodebases) {
      const argoApp = argoAppsByAppName.get(appCodebase.metadata.name);
      if (!argoApp) {
        summary.missing++;
        continue;
      }
      const healthStatus = getApplicationStatus(argoApp);
      const status = healthStatus.status?.toLowerCase();
      if (status === applicationHealthStatus.healthy) {
        summary.healthy++;
      } else if (status === applicationHealthStatus.progressing) {
        summary.progressing++;
      } else if (status === applicationHealthStatus.degraded) {
        summary.degraded++;
      } else if (status === applicationHealthStatus.missing) {
        summary.missing++;
      }
    }
    return summary;
  }, [pipelineAppCodebases, argoAppsByAppName]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm">Application Health:</span>
      {healthSummary.healthy > 0 && (
        <div className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 dark:border-green-800 dark:bg-green-950">
          <CheckCircle className="size-3.5 text-green-600 dark:text-green-400" />
          <span className="text-xs text-green-700 dark:text-green-400">{healthSummary.healthy} Healthy</span>
        </div>
      )}
      {healthSummary.progressing > 0 && (
        <div className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 dark:border-blue-800 dark:bg-blue-950">
          <Clock className="size-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs text-blue-700 dark:text-blue-400">{healthSummary.progressing} Progressing</span>
        </div>
      )}
      {healthSummary.degraded > 0 && (
        <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 dark:border-red-800 dark:bg-red-950">
          <XCircle className="size-3.5 text-red-600 dark:text-red-400" />
          <span className="text-xs text-red-700 dark:text-red-400">{healthSummary.degraded} Degraded</span>
        </div>
      )}
      {healthSummary.missing > 0 && (
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-900">
          <AlertTriangle className="size-3.5 text-slate-600 dark:text-slate-400" />
          <span className="text-xs text-slate-700 dark:text-slate-400">{healthSummary.missing} Missing</span>
        </div>
      )}
    </div>
  );
};
