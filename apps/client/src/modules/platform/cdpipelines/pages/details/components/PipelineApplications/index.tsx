import React from "react";
import { Link } from "@tanstack/react-router";
import { ScrollText, Terminal } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { DataTable } from "@/core/components/Table";
import { TableColumn } from "@/core/components/Table/types";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import { StatusBadge } from "@/core/components/StatusBadge";
import { QuickLink } from "@/core/components/QuickLink";
import { ScrollCopyText } from "@/core/components/ScrollCopyText";
import { CodebaseLanguageIcon } from "@/modules/platform/codebases/components/CodebaseLanguageIcon";
import { CodebaseFrameworkIcon } from "@/modules/platform/codebases/components/CodebaseFrameworkIcon";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { getApplicationStatusIcon, getApplicationSyncStatusIcon } from "@/k8s/api/groups/ArgoCD/Application";
import {
  getApplicationStatus,
  getApplicationSyncStatus,
  applicationLabels,
  systemQuickLink,
  Codebase,
  Application,
} from "@my-project/shared";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { usePipelineArgoApplicationListWatch, useQuickLinksUrlListWatch } from "../../hooks/data";
import { usePipelineAppCodebases, useSortedStages } from "../../hooks/usePipelineData";
import { routeCDPipelineDetails } from "../../route";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { PodLogsDialog } from "../../../../dialogs/PodLogs";
import { PodExecDialog } from "../../../../dialogs/PodExec";

const TABLE_ID = "pipelineApplicationsList";

const useColumns = (
  clusterName: string,
  namespace: string,
  sortedStagesCount: number,
  argoAppsByAppAndStage: Map<string, Map<string, Application>>
): TableColumn<Codebase>[] => {
  return React.useMemo(
    () => [
      {
        id: "name",
        label: "Application",
        data: {
          columnSortableValuePath: "metadata.name",
          render: ({ data }) => (
            <Button variant="link" asChild className="h-auto justify-start p-0 text-sm font-medium">
              <Link
                to={PATH_PROJECT_DETAILS_FULL}
                params={{
                  clusterName,
                  name: data.metadata.name,
                  namespace: data.metadata.namespace || namespace,
                }}
              >
                <ENTITY_ICON.project className="text-muted-foreground/70 mr-1.5 shrink-0" />
                {data.metadata.name}
              </Link>
            </Button>
          ),
        },
        cell: {
          baseWidth: 25,
        },
      },
      {
        id: "type",
        label: "Type",
        data: {
          columnSortableValuePath: "spec.type",
          render: ({ data }) => {
            return <Badge variant="outline">{capitalizeFirstLetter(data.spec.type)}</Badge>;
          },
        },
        cell: {
          baseWidth: 15,
        },
      },
      {
        id: "language",
        label: "Language",
        data: {
          render: ({ data }) => <CodebaseLanguageIcon codebase={data} />,
        },
        cell: {
          baseWidth: 15,
        },
      },
      {
        id: "framework",
        label: "Framework",
        data: {
          render: ({ data }) => <CodebaseFrameworkIcon codebase={data} />,
        },
        cell: {
          baseWidth: 15,
        },
      },
      {
        id: "environments",
        label: "Environments",
        data: {
          render: ({ data }) => {
            const appStages = argoAppsByAppAndStage.get(data.metadata.name);
            const deployedCount = appStages?.size || 0;

            return (
              <span className="text-muted-foreground text-sm">
                {deployedCount} / {sortedStagesCount} environments
              </span>
            );
          },
        },
        cell: {
          baseWidth: 30,
        },
      },
    ],
    [clusterName, namespace, sortedStagesCount, argoAppsByAppAndStage]
  );
};

export const PipelineApplications = () => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const params = routeCDPipelineDetails.useParams();
  const [expandedRowIds, setExpandedRowIds] = React.useState<Set<string | number>>(new Set());

  // Dialog openers
  const openPodLogsDialog = useDialogOpener(PodLogsDialog);
  const openPodExecDialog = useDialogOpener(PodExecDialog);

  // Fetch data
  const argoAppsWatch = usePipelineArgoApplicationListWatch();
  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();
  const { data: pipelineApplications, isLoading: isPipelineAppsLoading } = usePipelineAppCodebases();
  const { data: sortedStages, isLoading: isSortedStagesLoading } = useSortedStages();

  // Group Argo applications by app name and stage
  const argoAppsByAppAndStage = React.useMemo(() => {
    const map = new Map<string, Map<string, Application>>();

    for (const app of argoAppsWatch.data.array) {
      const appName = app.metadata?.labels?.[applicationLabels.appName];
      const stageName = app.metadata?.labels?.[applicationLabels.stage];

      if (appName && stageName) {
        if (!map.has(appName)) {
          map.set(appName, new Map());
        }
        map.get(appName)!.set(stageName, app);
      }
    }

    return map;
  }, [argoAppsWatch.data.array]);

  // Quick links
  const argocdQuickLink = quickLinksUrlListWatch.data?.quickLinkList?.find(
    (el) => el.metadata.name === systemQuickLink.argocd
  );
  const argocdBaseURL = quickLinksUrlListWatch.data?.quickLinkURLs?.[systemQuickLink.argocd];

  const columns = useColumns(clusterName, params.namespace, sortedStages.length, argoAppsByAppAndStage);

  const isLoading = isPipelineAppsLoading || isSortedStagesLoading || argoAppsWatch.isLoading;

  // Expandable row renderer
  const expandedRowRender = React.useCallback(
    (appCodebase: Codebase) => {
      const appStages = argoAppsByAppAndStage.get(appCodebase.metadata.name);
      const deployedCount = appStages?.size || 0;

      return (
        <div>
          <div className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            Deployed in {deployedCount} {deployedCount === 1 ? "environment" : "environments"}
          </div>

          <div className="space-y-3">
            {sortedStages.map((stage) => {
              const argoApplication = appStages?.get(stage.spec.name);

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
                                cdPipeline: params.name,
                                namespace: params.namespace,
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

              // Get status info
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
                              cdPipeline: params.name,
                              namespace: params.namespace,
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
                            appName: appCodebase.metadata.name,
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
                            appName: appCodebase.metadata.name,
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
    [
      argoAppsByAppAndStage,
      sortedStages,
      clusterName,
      params.name,
      params.namespace,
      argocdBaseURL,
      argocdQuickLink,
      openPodLogsDialog,
      openPodExecDialog,
    ]
  );

  return (
    <DataTable<Codebase>
      id={TABLE_ID}
      data={pipelineApplications}
      isLoading={isLoading}
      columns={columns}
      containerProps={{ "data-tour": "deployment-applications-tab" }}
      settings={{
        show: false,
      }}
      pagination={{
        show: false,
      }}
      outlined={false}
      expandable={{
        expandedRowRender,
        expandedRowIds,
        onExpandedRowsChange: setExpandedRowIds,
        getRowId: (row) => row.metadata.name,
      }}
    />
  );
};
