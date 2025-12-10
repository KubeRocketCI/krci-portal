import { QuickLink } from "@/core/components/QuickLink";
import { Stage, systemQuickLink, quickLinkLabels } from "@my-project/shared";
import { useQuickLinksUrlListWatch } from "../../../hooks/data";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { routeCDPipelineDetails } from "../../../route";

interface ExternalServicesProps {
  stage: Stage;
}

export const ExternalServices = ({ stage }: ExternalServicesProps) => {
  const params = routeCDPipelineDetails.useParams();
  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();

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

  return (
    <div className="bg-muted rounded-lg px-4 py-1">
      <div className="flex items-center justify-between">
        <h4 className="text-muted-foreground flex items-center gap-2 text-xs">External Services</h4>
        <div className="flex items-center gap-1">
          <QuickLink
            name={{
              label: quickLinkUiNames[systemQuickLink.argocd],
              value: systemQuickLink.argocd,
            }}
            iconBase64={argocdQuickLink?.spec?.icon}
            externalLink={LinkCreationService.argocd.createStageLink(
              argocdBaseURL,
              params.name,
              stage.spec.clusterName
            )}
            quickLink={argocdQuickLink}
            isTextButton
            variant="link"
          />
          <QuickLink
            name={{
              label: quickLinkUiNames[systemQuickLink.monitoring],
              value: systemQuickLink.monitoring,
            }}
            iconBase64={monitoringQuickLink?.spec?.icon}
            enabledText="Open Metrics"
            externalLink={LinkCreationService.monitoring.createDashboardLink({
              provider: monitoringQuickLink?.metadata?.labels?.[quickLinkLabels.provider],
              baseURL: monitoringBaseURL,
              namespace: stage.spec.namespace,
              clusterName: stage.spec.clusterName,
            })}
            quickLink={monitoringQuickLink}
            isTextButton
            variant="link"
          />
          <QuickLink
            name={{
              label: quickLinkUiNames[systemQuickLink.logging],
              value: systemQuickLink.logging,
            }}
            iconBase64={loggingQuickLink?.spec?.icon}
            enabledText="Open Logs"
            externalLink={LinkCreationService.logging.createDashboardLink({
              provider: loggingQuickLink?.metadata?.labels?.[quickLinkLabels.provider],
              baseURL: loggingBaseURL,
              namespace: stage.spec.namespace,
              clusterName: stage.spec.clusterName,
            })}
            quickLink={loggingQuickLink}
            isTextButton
            variant="link"
          />
        </div>
      </div>
    </div>
  );
};
