import React from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { DataTable } from "@/core/components/Table";
import { TableColumn } from "@/core/components/Table/types";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import { CodebaseLanguageIcon } from "@/modules/platform/codebases/components/CodebaseLanguageIcon";
import { CodebaseFrameworkIcon } from "@/modules/platform/codebases/components/CodebaseFrameworkIcon";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { StageDeploymentCards } from "@/modules/platform/cdpipelines/components/StageDeploymentCards";
import { applicationLabels, systemQuickLink, Codebase, Application } from "@my-project/shared";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { usePipelineArgoApplicationListWatch, useQuickLinksUrlListWatch } from "../../hooks/data";
import { usePipelineAppCodebases, useSortedStages } from "../../hooks/usePipelineData";
import { routeCDPipelineDetails } from "../../route";
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

      return (
        <StageDeploymentCards
          stages={sortedStages}
          getArgoApp={(stageName) => appStages?.get(stageName)}
          deployedCount={appStages?.size || 0}
          pipelineName={params.name}
          namespace={params.namespace}
          appName={appCodebase.metadata.name}
          clusterName={clusterName}
          argocdBaseURL={argocdBaseURL}
          argocdQuickLink={argocdQuickLink}
          onOpenLogs={openPodLogsDialog}
          onOpenTerminal={openPodExecDialog}
        />
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
