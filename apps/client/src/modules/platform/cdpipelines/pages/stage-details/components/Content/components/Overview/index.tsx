import { useStageWatch, useCDPipelineWatch, useApplicationsWatch } from "../../../../hooks";
import { routeStageDetails } from "../../../../route";
import { getStageStatusIcon } from "@/k8s/api/groups/KRCI/Stage";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Badge } from "@/core/components/ui/badge";
import { Card } from "@/core/components/ui/card";
import { ScrollCopyText } from "@/core/components/ScrollCopyText";
import { TriggerTemplatePipelinePreview } from "@/core/components/TriggerTemplatePipelinePreview";
import { StatusIcon } from "@/core/components/StatusIcon";
import { applicationHealthStatus, getApplicationStatus, stageTriggerType } from "@my-project/shared";
import KubernetesIcon from "@/assets/icons/k8s/kubernetes.svg?react";
import { Activity, Zap, Shield, Settings, Workflow } from "lucide-react";

export const Overview = () => {
  const params = routeStageDetails.useParams();
  const stageWatch = useStageWatch();
  const cdPipelineWatch = useCDPipelineWatch();
  const applicationsWatch = useApplicationsWatch();

  const stage = stageWatch.query.data;

  if (!stage) {
    return <LoadingWrapper isLoading={stageWatch.query.isFetching}>{null}</LoadingWrapper>;
  }

  const stageStatusIcon = getStageStatusIcon(stage);
  const appCount = cdPipelineWatch.data?.spec.applications?.length ?? 0;
  const argoApps = applicationsWatch.data.array;
  const healthyCount = argoApps.filter(
    (a) => getApplicationStatus(a).status === applicationHealthStatus.healthy
  ).length;
  const degradedCount = argoApps.filter(
    (a) => getApplicationStatus(a).status === applicationHealthStatus.degraded
  ).length;
  const triggerTypeMeta = (() => {
    switch (stage.spec.triggerType) {
      case stageTriggerType.Manual:
        return {
          label: "Manual",
          description: "Requires approval",
        };
      case stageTriggerType["Auto-stable"]:
        return {
          label: "Auto-stable",
          description: "Automatic deployment only after quality gates pass",
        };
      case stageTriggerType.Auto:
      default:
        return {
          label: "Auto",
          description: "Automatic deployment",
        };
    }
  })();

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Status */}
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded"
              style={{ backgroundColor: `${stageStatusIcon.color}15` }}
            >
              <StatusIcon
                Icon={stageStatusIcon.component}
                isSpinning={stageStatusIcon.isSpinning}
                color={stageStatusIcon.color}
                width={16}
              />
            </div>
            <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Status</div>
          </div>
          <div className="text-foreground text-lg font-semibold capitalize">{stage.status?.status || "Unknown"}</div>
          {stage.status?.detailed_message && (
            <div className="text-muted-foreground mt-1 truncate text-xs">{stage.status.detailed_message}</div>
          )}
        </Card>

        {/* Applications */}
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 dark:bg-blue-950">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Applications</div>
          </div>
          <div className="text-foreground text-lg font-semibold">{appCount}</div>
          <div className="text-muted-foreground mt-1 text-xs">
            {healthyCount} healthy{degradedCount > 0 && `, ${degradedCount} degraded`}
          </div>
        </Card>

        {/* Trigger Type */}
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-100 dark:bg-purple-950">
              <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Trigger Type</div>
          </div>
          <div className="text-foreground text-lg font-semibold">{triggerTypeMeta.label}</div>
          <div className="text-muted-foreground mt-1 text-xs">{triggerTypeMeta.description}</div>
        </Card>

        {/* Cluster */}
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-green-100 dark:bg-green-950">
              <KubernetesIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Cluster</div>
          </div>
          <div className="text-foreground text-lg font-semibold">{stage.spec.clusterName}</div>
          <div className="text-muted-foreground mt-1 text-xs">Kubernetes</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Environment Details */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="text-muted-foreground h-4 w-4" />
            <h3 className="text-foreground font-medium">Environment Details</h3>
          </div>
          <div>
            <div className="border-border flex items-center justify-between border-b py-1.5">
              <span className="text-muted-foreground text-sm">Namespace</span>
              <ScrollCopyText text={stage.spec.namespace} />
            </div>
            <div className="border-border flex items-start justify-between border-b py-1.5">
              <span className="text-muted-foreground text-sm">Quality Gates</span>
              <div className="flex flex-wrap items-center justify-end gap-1">
                {stage.spec.qualityGates && stage.spec.qualityGates.length > 0 ? (
                  stage.spec.qualityGates.map((gate, idx) => (
                    <Badge key={idx} variant="outline" className="flex items-center gap-1 text-xs">
                      <Shield className="size-3" />
                      <span className="capitalize">{gate.qualityGateType}</span>
                      {gate.qualityGateType === "autotests" && gate.autotestName && (
                        <span className="text-muted-foreground font-mono">
                          ({gate.autotestName}/{gate.branchName})
                        </span>
                      )}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">N/A</span>
                )}
              </div>
            </div>
            <div className="flex items-start justify-between py-1.5">
              <span className="text-muted-foreground text-sm">Description</span>
              <span className="text-foreground max-w-xs text-right text-sm">{stage.spec.description || "N/A"}</span>
            </div>
          </div>
        </Card>

        {/* Pipeline Configuration */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Workflow className="text-muted-foreground h-4 w-4" />
            <h3 className="text-foreground font-medium">Pipeline Configuration</h3>
          </div>
          <div>
            <div className="border-border flex items-center justify-between border-b py-1.5">
              <span className="text-muted-foreground text-sm">Deploy Pipeline</span>
              {stage.spec?.triggerTemplate ? (
                <TriggerTemplatePipelinePreview
                  triggerTemplateName={stage.spec.triggerTemplate}
                  namespace={stage.metadata.namespace!}
                  clusterName={params.clusterName}
                />
              ) : (
                <span className="text-muted-foreground text-sm">N/A</span>
              )}
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground text-sm">Clean Pipeline</span>
              {stage.spec?.cleanTemplate ? (
                <TriggerTemplatePipelinePreview
                  triggerTemplateName={stage.spec.cleanTemplate}
                  namespace={stage.metadata.namespace!}
                  clusterName={params.clusterName}
                />
              ) : (
                <span className="text-muted-foreground text-sm">N/A</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
