import { Link } from "@tanstack/react-router";
import { ScrollText, Terminal } from "lucide-react";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import { StatusBadge } from "@/core/components/StatusBadge";
import { QuickLink } from "@/core/components/QuickLink";
import { ScrollCopyText } from "@/core/components/ScrollCopyText";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { getApplicationStatusIcon, getApplicationSyncStatusIcon } from "@/k8s/api/groups/ArgoCD/Application";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { applicationLabels, getApplicationStatus, getApplicationSyncStatus, systemQuickLink } from "@my-project/shared";
import type { StageDeploymentCardsProps } from "./types";

export const StageDeploymentCards = ({
  stages,
  getArgoApp,
  deployedCount,
  pipelineName,
  namespace,
  appName,
  clusterName,
  argocdBaseURL,
  argocdQuickLink,
  onOpenLogs,
  onOpenTerminal,
}: StageDeploymentCardsProps) => {
  return (
    <div>
      <div className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
        Deployed in {deployedCount} {deployedCount === 1 ? "environment" : "environments"}
      </div>

      <div className="space-y-3">
        {stages.map((stage) => {
          const argoApplication = getArgoApp(stage.spec.name);

          if (!argoApplication) {
            return (
              <div key={stage.spec.name} className="bg-card rounded-lg border p-4 opacity-60">
                <div className="mb-2 flex items-center gap-2">
                  <Button variant="link" asChild className="h-auto p-0 font-medium">
                    <Link
                      to={PATH_CDPIPELINE_STAGE_DETAILS_FULL}
                      params={{
                        clusterName,
                        cdPipeline: pipelineName,
                        namespace,
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
                          cdPipeline: pipelineName,
                          namespace,
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
                      onOpenLogs({
                        namespace: stage.spec.namespace,
                        appName,
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
                      onOpenTerminal({
                        namespace: stage.spec.namespace,
                        appName,
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
};
