import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Package, RefreshCw, Box, AlertTriangle, ScrollText, Terminal, SquareArrowOutUpRight } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { StatusIcon } from "@/core/components/StatusIcon";
import { QuickLink } from "@/core/components/QuickLink";
import { getApplicationStatusIcon, getApplicationSyncStatusIcon } from "@/k8s/api/groups/ArgoCD/Application";
import {
  Stage,
  getApplicationStatus,
  getApplicationSyncStatus,
  systemQuickLink,
  applicationLabels,
} from "@my-project/shared";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { PATH_COMPONENT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { routeCDPipelineDetails } from "../../../route";
import {
  useQuickLinksUrlListWatch,
  useCDPipelineWatch,
  useAppCodebaseListWatch,
  useStageArgoApplicationListWatch,
} from "../../../hooks/data";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { PodLogsDialog } from "../../../../../dialogs/PodLogs";
import { PodExecDialog } from "../../../../../dialogs/PodExec";

interface ApplicationsListProps {
  stage: Stage;
}

export const ApplicationsList = ({ stage }: ApplicationsListProps) => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const params = routeCDPipelineDetails.useParams();

  // Dialog openers
  const openPodLogsDialog = useDialogOpener(PodLogsDialog);
  const openPodExecDialog = useDialogOpener(PodExecDialog);

  // Fetch data
  const cdPipelineWatch = useCDPipelineWatch();
  const appCodebaseListWatch = useAppCodebaseListWatch();
  const stageArgoAppsWatch = useStageArgoApplicationListWatch(stage.spec.name);
  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();

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

  // Quick links
  const argocdQuickLink = quickLinksUrlListWatch.data?.quickLinkList?.find(
    (el) => el.metadata.name === systemQuickLink.argocd
  );
  const argocdBaseURL = quickLinksUrlListWatch.data?.quickLinkURLs?.[systemQuickLink.argocd];

  return (
    <div>
      <h4 className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
        <Package className="size-3" />
        Deployed Versions
      </h4>
      <div className="flex flex-col gap-2">
        {pipelineAppCodebases.map((appCodebase) => {
          // Lookup the Argo application for this codebase in this stage
          const argoApplication = argoAppsByAppName.get(appCodebase.metadata.name);

          // Get status info
          const healthStatus = argoApplication ? getApplicationStatus(argoApplication) : { status: "Missing" };
          const syncStatus = argoApplication ? getApplicationSyncStatus(argoApplication) : { status: "Unknown" };
          const healthStatusIcon = argoApplication
            ? getApplicationStatusIcon(argoApplication)
            : { component: AlertTriangle, color: "#94a3b8" };
          const syncStatusIcon = argoApplication
            ? getApplicationSyncStatusIcon(argoApplication)
            : { component: RefreshCw, color: "#94a3b8" };
          const version = argoApplication?.spec?.source?.targetRevision || "N/A";
          const externalURLs = argoApplication?.status?.summary?.externalURLs;

          const argoAppLink = argoApplication
            ? LinkCreationService.argocd.createApplicationLink(
                argocdBaseURL,
                argoApplication.metadata?.labels?.[applicationLabels.pipeline],
                argoApplication.metadata?.labels?.[applicationLabels.stage],
                argoApplication.metadata?.labels?.[applicationLabels.appName]
              )
            : undefined;

          return (
            <div
              key={appCodebase.metadata.name}
              className="bg-secondary/30 col-span-full grid grid-cols-[minmax(7.5rem,12.5rem)_auto_auto_auto_auto_1fr] items-center gap-x-3 rounded-lg border p-2.5"
            >
              <div className="flex items-center gap-2">
                <Button variant="link" asChild className="text-foreground h-auto justify-start p-0 text-sm">
                  <Link
                    to={PATH_COMPONENT_DETAILS_FULL}
                    params={{
                      clusterName,
                      name: appCodebase.metadata.name,
                      namespace: appCodebase.metadata.namespace || params.namespace,
                    }}
                  >
                    <Box className="shrink-0" />
                    {appCodebase.metadata.name}
                  </Link>
                </Button>
              </div>
              <Badge variant="outline" className="w-fit font-mono text-xs">
                {version}
              </Badge>
              <div
                className="flex w-fit items-center gap-1 rounded px-2 py-0.5 text-xs"
                style={{ backgroundColor: `${healthStatusIcon.color}15`, color: healthStatusIcon.color }}
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
                className="flex w-fit items-center gap-1 rounded px-2 py-0.5 text-xs"
                style={{ backgroundColor: `${syncStatusIcon.color}15`, color: syncStatusIcon.color }}
              >
                <RefreshCw className="size-3" />
                <span className="capitalize">{syncStatus.status}</span>
              </div>
              <QuickLink
                name={{
                  label: quickLinkUiNames[systemQuickLink.argocd],
                  value: systemQuickLink.argocd,
                }}
                iconBase64={argocdQuickLink?.spec?.icon}
                externalLink={argoAppLink}
                quickLink={argocdQuickLink}
                isTextButton
                variant="link"
              />
              <div className="flex items-center justify-end gap-2">
                {externalURLs && externalURLs.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Badge
                        variant="outline"
                        className="bg-muted text-muted-foreground hover:bg-accent hover:border-primary/50 cursor-pointer py-1 text-xs [&>svg]:size-4"
                      >
                        <SquareArrowOutUpRight className="mr-1" />
                        {externalURLs.length} {externalURLs.length === 1 ? "Ingress" : "Ingresses"}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="max-h-80 w-80 overflow-y-auto">
                      <div className="border-border text-muted-foreground border-b px-2 py-1.5 text-xs font-medium">
                        Ingresses ({externalURLs.length})
                      </div>
                      {externalURLs.map((url: string) => (
                        <DropdownMenuItem key={url} className="text-xs" asChild>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <SquareArrowOutUpRight className="text-muted-foreground mr-2" />
                            <span className="truncate">{url}</span>
                          </a>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() =>
                    openPodLogsDialog({
                      namespace: stage.spec.namespace,
                      appName: appCodebase.metadata.name,
                    })
                  }
                >
                  <ScrollText className="size-3" />
                  View Logs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() =>
                    openPodExecDialog({
                      namespace: stage.spec.namespace,
                      appName: appCodebase.metadata.name,
                    })
                  }
                >
                  <Terminal className="size-3" />
                  Open Terminal
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
