import { QuickLink } from "@/core/components/QuickLink";
import { Stage, systemQuickLink, quickLinkLabels } from "@my-project/shared";
import { useQuickLinksUrlListWatch } from "../../../hooks/data";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { routeCDPipelineDetails } from "../../../route";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { ManageQuickLinkDialog } from "@/modules/platform/configuration/modules/quicklinks/dialogs/ManageQuickLink";
import { Button } from "@/core/components/ui/button";

interface ExternalServicesProps {
  stage: Stage;
}

export function ExternalServices({ stage }: ExternalServicesProps) {
  const params = routeCDPipelineDetails.useParams();
  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();
  const openManageQuickLinkDialog = useDialogOpener(ManageQuickLinkDialog);

  const argocdQuickLink = quickLinksUrlListWatch.data?.quickLinkList?.find(
    (el) => el.metadata.name === systemQuickLink.argocd
  );
  const monitoringQuickLink = quickLinksUrlListWatch.data?.quickLinkList?.find(
    (el) => el.metadata.name === systemQuickLink.monitoring
  );
  const loggingQuickLink = quickLinksUrlListWatch.data?.quickLinkList?.find(
    (el) => el.metadata.name === systemQuickLink.logging
  );

  const argocdBaseURL = quickLinksUrlListWatch.data?.quickLinkURLs?.[systemQuickLink.argocd];
  const monitoringBaseURL = quickLinksUrlListWatch.data?.quickLinkURLs?.[systemQuickLink.monitoring];
  const loggingBaseURL = quickLinksUrlListWatch.data?.quickLinkURLs?.[systemQuickLink.logging];

  const quickLinkSetupAction = (quickLink: typeof argocdQuickLink) => {
    if (!quickLink) return undefined;

    return (
      <Button
        variant="ghost"
        onClick={() =>
          openManageQuickLinkDialog({
            quickLink,
            isSystem: Object.hasOwn(systemQuickLink, quickLink.metadata.name),
          })
        }
      >
        here
      </Button>
    );
  };

  return (
    <div className="bg-muted rounded-lg px-4 py-2">
      <div className="flex items-center justify-between">
        <h4 className="text-muted-foreground flex items-center gap-2 text-xs">External Services</h4>
        <div className="flex items-center gap-1">
          <QuickLink
            name={quickLinkUiNames[systemQuickLink.argocd]}
            icon={argocdQuickLink?.spec?.icon}
            href={LinkCreationService.argocd.createStageLink(argocdBaseURL, params.name, stage.spec.name)}
            setupAction={quickLinkSetupAction(argocdQuickLink)}
            display="text"
            variant="link"
          />
          <QuickLink
            name={quickLinkUiNames[systemQuickLink.monitoring]}
            icon={monitoringQuickLink?.spec?.icon}
            tooltip="Open Metrics"
            href={LinkCreationService.monitoring.createDashboardLink({
              provider: monitoringQuickLink?.metadata?.labels?.[quickLinkLabels.provider],
              baseURL: monitoringBaseURL,
              namespace: stage.spec.namespace,
              clusterName: stage.spec.clusterName,
            })}
            setupAction={quickLinkSetupAction(monitoringQuickLink)}
            display="text"
            variant="link"
          />
          <QuickLink
            name={quickLinkUiNames[systemQuickLink.logging]}
            icon={loggingQuickLink?.spec?.icon}
            tooltip="Open Logs"
            href={LinkCreationService.logging.createDashboardLink({
              provider: loggingQuickLink?.metadata?.labels?.[quickLinkLabels.provider],
              baseURL: loggingBaseURL,
              namespace: stage.spec.namespace,
              clusterName: stage.spec.clusterName,
            })}
            setupAction={quickLinkSetupAction(loggingQuickLink)}
            display="text"
            variant="link"
          />
        </div>
      </div>
    </div>
  );
}
