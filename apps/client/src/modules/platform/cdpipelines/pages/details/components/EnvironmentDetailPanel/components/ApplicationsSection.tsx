import { Link } from "@tanstack/react-router";
import { Package, AlertTriangle, ScrollText, Terminal, SquareArrowOutUpRight, RefreshCw } from "lucide-react";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { QuickLink } from "@/core/components/QuickLink";
import { StatusBadge } from "@/core/components/StatusBadge";
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
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { routeCDPipelineDetails } from "../../../route";
import { useQuickLinksUrlListWatch, useStageArgoApplicationListWatch } from "../../../hooks/data";
import { usePipelineAppCodebases, useArgoAppsByAppName } from "../../../hooks/usePipelineData";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { PodLogsDialog } from "../../../../../dialogs/PodLogs";
import { PodExecDialog } from "../../../../../dialogs/PodExec";
import { ScrollCopyText } from "@/core/components/ScrollCopyText";

interface ApplicationsSectionProps {
  stage: Stage;
}

export function ApplicationsSection({ stage }: ApplicationsSectionProps) {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const params = routeCDPipelineDetails.useParams();

  // Dialog openers
  const openPodLogsDialog = useDialogOpener(PodLogsDialog);
  const openPodExecDialog = useDialogOpener(PodExecDialog);

  // Fetch data
  const stageArgoAppsWatch = useStageArgoApplicationListWatch(stage.spec.name);
  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();
  const { data: pipelineAppCodebases } = usePipelineAppCodebases();
  const argoAppsByAppName = useArgoAppsByAppName(stageArgoAppsWatch.data.array);

  // Quick links
  const argocdQuickLink = quickLinksUrlListWatch.data?.quickLinkList?.find(
    (el) => el.metadata.name === systemQuickLink.argocd
  );
  const argocdBaseURL = quickLinksUrlListWatch.data?.quickLinkURLs?.[systemQuickLink.argocd];

  return (
    <div className="p-5 lg:col-span-2" data-tour="deployment-applications-section">
      <h4 className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
        <Package className="size-3" /> Deployed Applications
      </h4>
      <div className="grid gap-2" style={{ gridTemplateColumns: "minmax(10rem, 14rem) 200px auto auto auto" }}>
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
              className="group bg-secondary/30 hover:border-border/80 hover:bg-card col-span-5 grid items-center gap-3 rounded-xl border p-2.5"
              style={{ gridTemplateColumns: "subgrid" }}
            >
              {/* Title Column */}
              <div className="flex items-center gap-2">
                <Button variant="link" asChild className="text-foreground h-auto justify-start p-0 text-sm">
                  <Link
                    to={PATH_PROJECT_DETAILS_FULL}
                    params={{
                      clusterName,
                      name: appCodebase.metadata.name,
                      namespace: appCodebase.metadata.namespace || params.namespace,
                    }}
                  >
                    <ENTITY_ICON.project className="text-muted-foreground/70 mr-1.5 shrink-0" />
                    {appCodebase.metadata.name}
                  </Link>
                </Button>
              </div>

              {/* Version Column */}
              <div className="flex items-center">
                <ScrollCopyText text={version} className="w-full max-w-full" showFromEnd />
              </div>

              {/* Status Column */}
              <div className="flex items-center gap-2">
                <StatusBadge statusIcon={healthStatusIcon} label={healthStatus.status} />
                <StatusBadge statusIcon={syncStatusIcon} label={syncStatus.status} />
              </div>

              {/* Ingresses Column */}
              <div className="flex items-center justify-end">
                {externalURLs && externalURLs.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Badge
                        variant="outline"
                        className="bg-muted text-muted-foreground hover:bg-accent hover:border-primary/50 cursor-pointer py-1 text-xs [&>svg]:size-3"
                      >
                        <SquareArrowOutUpRight className="text-muted-foreground/70 mr-1" />
                        {externalURLs.length}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="max-h-80 w-80 overflow-y-auto">
                      <div className="border-border text-muted-foreground border-b px-2 py-1.5 text-xs font-medium">
                        Ingresses ({externalURLs.length})
                      </div>
                      {externalURLs.map((url: string) => (
                        <DropdownMenuItem key={url} className="text-xs" asChild>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <SquareArrowOutUpRight className="text-muted-foreground/70 mr-2" />
                            <span className="truncate">{url}</span>
                          </a>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-muted text-muted-foreground py-1 text-xs opacity-50 [&>svg]:size-3"
                  >
                    <SquareArrowOutUpRight className="text-muted-foreground/70 mr-1" />0
                  </Badge>
                )}
              </div>

              {/* Actions Column */}
              <div className="flex items-center justify-end gap-1">
                <QuickLink
                  name={quickLinkUiNames[systemQuickLink.argocd]}
                  icon={argocdQuickLink?.spec?.icon}
                  href={argoAppLink}
                  display="text"
                  variant="link"
                  size="xs"
                />
                <Button
                  variant="outline"
                  size="xs"
                  className="gap-1.5 text-xs"
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
                  className="gap-1.5 text-xs"
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
          );
        })}
      </div>
    </div>
  );
}
