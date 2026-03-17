import React from "react";
import { Copy, CopyCheck } from "lucide-react";
import { DataTable } from "@/core/components/Table";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { TABLE } from "@/k8s/constants/tables";
import { useClusterStore } from "@/k8s/store";
import { PodLogsDialog } from "@/modules/platform/cdpipelines/dialogs/PodLogs";
import { PodExecDialog } from "@/modules/platform/cdpipelines/dialogs/PodExec";
import { StageDeploymentCards } from "@/modules/platform/cdpipelines/components/StageDeploymentCards";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { applicationLabels, systemQuickLink } from "@my-project/shared";
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
      };
    });
  }, [applications, stagesWatch]);

  const copyText = React.useMemo(() => {
    if (!pipelineDeployments.length) return "";

    return pipelineDeployments
      .flatMap((deployment) =>
        deployment.stages
          .filter((stage) => deployment.argoApps.has(stage.spec.name))
          .map((stage) => {
            const app = deployment.argoApps.get(stage.spec.name)!;
            const version = app.spec?.source?.targetRevision ?? "N/A";

            return [
              `cluster: ${clusterName}`,
              `deployment: ${deployment.pipelineName}`,
              `environment: ${stage.spec.name}`,
              `namespace: ${stage.spec.namespace}`,
              "",
              `${params.name}:${version}`,
            ].join("\n");
          })
      )
      .join("\n======\n");
  }, [pipelineDeployments, params.name, clusterName]);

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
    (deployment: PipelineDeployment) => (
      <StageDeploymentCards
        stages={deployment.stages}
        getArgoApp={(stageName) => deployment.argoApps.get(stageName)}
        deployedCount={deployment.argoApps.size}
        pipelineName={deployment.pipelineName}
        namespace={deployment.namespace}
        appName={params.name}
        clusterName={clusterName}
        argocdBaseURL={argocdBaseURL}
        argocdQuickLink={argocdQuickLink}
        onOpenLogs={openPodLogsDialog}
        onOpenTerminal={openPodExecDialog}
      />
    ),
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
