import React from "react";
import { Link } from "@tanstack/react-router";
import { ScrollText, Terminal } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { DataTable } from "@/core/components/Table";
import { TableColumn } from "@/core/components/Table/types";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import { StatusIcon } from "@/core/components/StatusIcon";
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
import {
  useCDPipelineWatch,
  useAppCodebaseListWatch,
  useStageListWatch,
  usePipelineArgoApplicationListWatch,
  useQuickLinksUrlListWatch,
} from "../../hooks/data";
import { routeCDPipelineDetails } from "../../route";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { PodLogsDialog } from "../../../../dialogs/PodLogs";
import { PodExecDialog } from "../../../../dialogs/PodExec";
import { cn } from "@/core/utils/classname";

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
  const cdPipelineWatch = useCDPipelineWatch();
  const appCodebaseListWatch = useAppCodebaseListWatch();
  const stageListWatch = useStageListWatch();
  const argoAppsWatch = usePipelineArgoApplicationListWatch();
  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();

  // Filter app codebases to only those in the pipeline
  const pipelineApplications = React.useMemo(() => {
    const cdPipeline = cdPipelineWatch.data;
    if (!cdPipeline) return [];

    return appCodebaseListWatch.data.array.filter((appCodebase) =>
      cdPipeline.spec.applications.some((appName) => appName === appCodebase.metadata.name)
    );
  }, [cdPipelineWatch.data, appCodebaseListWatch.data.array]);

  // Sort stages by order
  const sortedStages = React.useMemo(() => {
    return stageListWatch.data.array.toSorted((a, b) => a.spec.order - b.spec.order);
  }, [stageListWatch.data.array]);

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

  const isLoading =
    cdPipelineWatch.isLoading || appCodebaseListWatch.isLoading || stageListWatch.isLoading || argoAppsWatch.isLoading;

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
                            {stage.spec.name}
                          </Link>
                        </Button>
                        <div
                          className={cn("flex h-6 w-fit items-center gap-1 rounded px-2 py-0.5 text-xs")}
                          style={{
                            backgroundColor: `${healthStatusIcon.color}15`,
                            color: healthStatusIcon.color,
                          }}
                        >
                          <StatusIcon
                            Icon={healthStatusIcon.component}
                            color={healthStatusIcon.color}
                            isSpinning={healthStatusIcon.isSpinning}
                            width={12}
                          />
                          <span className="capitalize">{healthStatus.status}</span>
                        </div>
                        <div
                          className={cn("flex h-6 w-fit items-center gap-1 rounded px-2 py-0.5 text-xs")}
                          style={{
                            backgroundColor: `${syncStatusIcon.color}15`,
                            color: syncStatusIcon.color,
                          }}
                        >
                          <StatusIcon
                            Icon={syncStatusIcon.component}
                            color={syncStatusIcon.color}
                            isSpinning={syncStatusIcon.isSpinning}
                            width={12}
                          />
                          <span className="capitalize">{syncStatus.status}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1 text-xs">Build Version</div>
                          <ScrollCopyText text={version} className="w-full max-w-full" />
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1 text-xs">Namespace</div>
                          <div className="text-foreground">{stage.spec.namespace}</div>
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
