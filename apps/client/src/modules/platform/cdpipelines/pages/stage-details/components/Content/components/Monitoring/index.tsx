import { LinkCreationService } from "@/k8s/services/link-creation";
import { useQuickLinksUrlListWatch, useStageWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { quickLinkLabels, systemQuickLink } from "@my-project/shared";
import { Card } from "@/core/components/ui/card";

export const Monitoring = () => {
  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();
  const stageWatch = useStageWatch();

  const quickLinksUrls = quickLinksUrlListWatch.data?.quickLinkURLs;
  const monitoringQuickLinkBaseUrl = quickLinksUrls?.[systemQuickLink.monitoring];

  const quickLinks = quickLinksUrlListWatch.data?.quickLinkList;
  const monitoringQuickLink = quickLinks?.find((quickLink) => quickLink.metadata.name === systemQuickLink.monitoring);
  const monitoringQuickLinkProvider = monitoringQuickLink?.metadata.labels?.[quickLinkLabels.provider];

  const stage = stageWatch.query.data;
  const namespace = stage?.spec.namespace;
  const clusterName = stage?.spec.clusterName;

  return (
    <Card className="p-6">
      <h3 className="text-foreground mb-4 text-xl font-semibold">Monitoring</h3>
      <iframe
        title="monitoring"
        frameBorder="0"
        height="800"
        width="100%"
        src={LinkCreationService.monitoring.createDashboardLink({
          provider: monitoringQuickLinkProvider,
          baseURL: monitoringQuickLinkBaseUrl,
          namespace: namespace!,
          clusterName,
        })}
      />
    </Card>
  );
};
