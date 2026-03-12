import React from "react";
import { Link } from "@tanstack/react-router";
import { Copy, CopyCheck, ScrollText, Terminal } from "lucide-react";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import { DataTable } from "@/core/components/Table";
import { StatusBadge } from "@/core/components/StatusBadge";
import { QuickLink } from "@/core/components/QuickLink";
import { ScrollCopyText } from "@/core/components/ScrollCopyText";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { TABLE } from "@/k8s/constants/tables";
import { useClusterStore } from "@/k8s/store";
import { getApplicationStatusIcon, getApplicationSyncStatusIcon } from "@/k8s/api/groups/ArgoCD/Application";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { PodLogsDialog } from "@/modules/platform/cdpipelines/dialogs/PodLogs";
import { PodExecDialog } from "@/modules/platform/cdpipelines/dialogs/PodExec";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { applicationLabels, getApplicationStatus, getApplicationSyncStatus, systemQuickLink } from "@my-project/shared";
import { useCodebaseApplicationsWatch, useCodebaseStagesWatch, useQuickLinksUrlListWatch } from "../../hooks/data";
import { routeProjectDetails } from "../../route";
import { useColumns } from "./hooks/useColumns";
import type { PipelineDeployment } from "./types";

export const DeploymentStatusWidget = () => {
  const params = routeProjectDetails.useParams();
  const applicationsWatch = useCodebaseApplicationsWatch();
  const stagesWatch = useCodebaseStagesWatch();
  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();
  const columns = useColumns();
  const applications = applicationsWatch.data.array;
  const clusterName = useClusterStore((state) => state.clusterName);
  const [expandedRowIds, setExpandedRowIds] = React.useState<Set<string | number>>(new Set());

  const openPodLogsDialog = useDialogOpener(PodLogsDialog);
  const openPodExecDialog = useDialogOpener(PodExecDialog);

  const argocdQuickLink = quickLinksUrlListWatch.data?.quickLinkList?.find(
    (el) => el.metadata.name === systemQuickLink.argocd
  );
  const argocdBaseURL = quickLinksUrlListWatch.data?.quickLinkURLs?.[systemQuickLink.argocd];

  // Group applications by pipeline and map stages
  const pipelineDeployments = React.useMemo<PipelineDeployment[]>(() => {
    const pipelineMap = new Map<string, Map<string, (typeof applications)[number]>>();
    const pipelineNamespaces = new Map<string, string>();

    for (const app of applications) {
      const pipeline = app.metadata?.labels?.[applicationLabels.pipeline];
      const stage = app.metadata?.labels?.[applicationLabels.stage];
      if (!pipeline || !stage) continue;

      if (!pipelineMap.has(pipeline)) {
        pipelineMap.set(pipeline, new Map());
      }
      pipelineMap.get(pipeline)!.set(stage, app);
      pipelineNamespaces.set(pipeline, app.metadata.namespace!);
    }

    // Group stages by pipeline
    const stagesByPipeline = new Map<string, typeof stagesWatch.data.array>();
    for (const stage of stagesWatch.data.array) {
      const pipeline = stage.spec.cdPipeline;
      if (!pipelineMap.has(pipeline)) continue;
      if (!stagesByPipeline.has(pipeline)) {
        stagesByPipeline.set(pipeline, []);
      }
      stagesByPipeline.get(pipeline)!.push(stage);
    }

    // Sort stages by order within each pipeline
    for (const [, stages] of stagesByPipeline) {
      stages.sort((a, b) => a.spec.order - b.spec.order);
    }

    return Array.from(pipelineMap.entries()).map(([pipelineName, argoApps]) => {
      const stages = stagesByPipeline.get(pipelineName) || [];
      return {
        pipelineName,
        namespace: pipelineNamespaces.get(pipelineName) || "",
        argoApps,
        stages,
        totalStages: stages.length,
      };
    });
  }, [applications, stagesWatch.data.array]);

  // Copy text
  const stageNamespaceMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const stage of stagesWatch.data.array) {
      map.set(`${stage.spec.cdPipeline}/${stage.spec.name}`, stage.spec.namespace);
    }
    return map;
  }, [stagesWatch.data.array]);

  const copyText = React.useMemo(() => {
    if (!applications.length) return "";

    return applications
      .map((app) => {
        const pipeline = app.metadata?.labels?.[applicationLabels.pipeline] ?? "";
        const stage = app.metadata?.labels?.[applicationLabels.stage] ?? "";
        const namespace = stageNamespaceMap.get(`${pipeline}/${stage}`) ?? "";
        const version = app.spec?.source?.targetRevision ?? "N/A";

        return [
          `cluster: ${clusterName}`,
          `deployment: ${pipeline}`,
          `environment: ${stage}`,
          `namespace: ${namespace}`,
          "",
          `${params.name}:${version}`,
        ].join("\n");
      })
      .join("\n======\n");
  }, [applications, params.name, stageNamespaceMap, clusterName]);

  const [isCopied, setIsCopied] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsCopied(true);
    timeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
  };

  // Expandable row renderer
  const expandedRowRender = React.useCallback(
    (deployment: PipelineDeployment) => {
      const deployedCount = deployment.argoApps.size;

      return (
        <div>
          <div className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            Deployed in {deployedCount} {deployedCount === 1 ? "environment" : "environments"}
          </div>

          <div className="space-y-3">
            {deployment.stages.map((stage) => {
              const argoApplication = deployment.argoApps.get(stage.spec.name);

              if (!argoApplication) {
                return (
                  <div key={stage.spec.name} className="bg-card rounded-lg border p-4 opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Button variant="link" asChild className="h-auto p-0 font-medium">
                            <Link
                              to={PATH_CDPIPELINE_STAGE_DETAILS_FULL}
                              params={{
                                clusterName,
                                cdPipeline: deployment.pipelineName,
                                namespace: deployment.namespace,
                                stage: stage.spec.name,
                              }}
                            >
                              <ENTITY_ICON.stage className="text-muted-foreground/70 mr-1.5 shrink-0" />
                              {stage.spec.name}
                            </Link>
                          </Button>
                          <Badge variant="outline" className="text-xs">
                            Not deployed
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const healthStatus = getApplicationStatus(argoApplication);
              const syncStatus = getApplicationSyncStatus(argoApplication);
              const healthStatusIcon = getApplicationStatusIcon(argoApplication);
              const syncStatusIcon = getApplicationSyncStatusIcon(argoApplication);
              const version = argoApplication?.spec?.source?.targetRevision || "N/A";

              const argoAppLink = LinkCreationService.argocd.createApplicationLink(
                argocdBaseURL,
                argoApplication.metadata?.labels?.[applicationLabels.pipeline],
                argoApplication.metadata?.labels?.[applicationLabels.stage],
                argoApplication.metadata?.labels?.[applicationLabels.appName]
              );

              return (
                <div key={stage.spec.name} className="bg-card rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-2">
                        <Button variant="link" asChild className="h-auto p-0 font-medium">
                          <Link
                            to={PATH_CDPIPELINE_STAGE_DETAILS_FULL}
                            params={{
                              clusterName,
                              cdPipeline: deployment.pipelineName,
                              namespace: deployment.namespace,
                              stage: stage.spec.name,
                            }}
                          >
                            <ENTITY_ICON.stage className="text-muted-foreground/70 mr-1.5 shrink-0" />
                            {stage.spec.name}
                          </Link>
                        </Button>
                        <StatusBadge statusIcon={healthStatusIcon} label={healthStatus.status} />
                        <StatusBadge statusIcon={syncStatusIcon} label={syncStatus.status} />
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1 text-xs">Build Version</div>
                          <ScrollCopyText text={version} className="w-full max-w-full" />
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1 text-xs">Namespace</div>
                          <ScrollCopyText text={stage.spec.namespace} className="w-full max-w-full" />
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1 text-xs">Cluster</div>
                          <div className="text-foreground">{stage.spec.clusterName}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1 text-xs">Trigger Type</div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {stage.spec.triggerType}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex gap-2">
                      <QuickLink
                        name={quickLinkUiNames[systemQuickLink.argocd]}
                        icon={argocdQuickLink?.spec?.icon}
                        href={argoAppLink}
                        display="text"
                        variant="outline"
                        size="xs"
                      />
                      <Button
                        variant="outline"
                        size="xs"
                        className="gap-1.5"
                        onClick={() =>
                          openPodLogsDialog({
                            namespace: stage.spec.namespace,
                            appName: params.name,
                          })
                        }
                      >
                        <ScrollText className="size-3" />
                        Logs
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        className="gap-1.5"
                        onClick={() =>
                          openPodExecDialog({
                            namespace: stage.spec.namespace,
                            appName: params.name,
                          })
                        }
                      >
                        <Terminal className="size-3" />
                        Terminal
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    },
    [clusterName, argocdBaseURL, argocdQuickLink, openPodLogsDialog, openPodExecDialog, params.name]
  );

  return (
    <Card className="space-y-4 p-6" data-tour="deployments-table">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground text-xl font-semibold">Deployments</h3>
        {applications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5">
            {isCopied ? <CopyCheck className="size-4" /> : <Copy className="size-4" />}
            Copy deployment status
          </Button>
        )}
      </div>
      {applicationsWatch.isReady && applications.length === 0 ? (
        <p className="text-muted-foreground py-4 text-sm">Not deployed to any environment</p>
      ) : (
        <DataTable<PipelineDeployment>
          id={TABLE.CODEBASE_DEPLOYMENTS.id}
          name={TABLE.CODEBASE_DEPLOYMENTS.name}
          isLoading={!applicationsWatch.isReady}
          data={pipelineDeployments}
          errors={[]}
          columns={columns}
          pagination={{ show: false }}
          settings={{ show: false }}
          outlined={false}
          expandable={{
            expandedRowRender,
            expandedRowIds,
            onExpandedRowsChange: setExpandedRowIds,
            getRowId: (row) => row.pipelineName,
          }}
        />
      )}
    </Card>
  );
};
