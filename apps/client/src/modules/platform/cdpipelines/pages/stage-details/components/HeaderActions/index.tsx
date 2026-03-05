import { QuickLink } from "@/core/components/QuickLink";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { StageActionsMenu } from "@/modules/platform/cdpipelines/components/StageActionsMenu";
import { quickLinkLabels, systemQuickLink } from "@my-project/shared";
import { routeStageDetails } from "../../route";
import { PATH_CONFIG_ARGOCD_FULL } from "@/modules/platform/configuration/modules/argocd/route";
import { PATH_CDPIPELINE_DETAILS_FULL } from "../../../details/route";
import { Link } from "@tanstack/react-router";
import { useQuickLinksUrlListWatch, useStageListWatch, useCDPipelineWatch, useStageWatch } from "../../hooks";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { Button } from "@/core/components/ui/button";
import { EllipsisVertical } from "lucide-react";
import React from "react";

export const HeaderActions = () => {
  const params = routeStageDetails.useParams();
  const stageWatch = useStageWatch();
  const stageListWatch = useStageListWatch();
  const cdPipelineWatch = useCDPipelineWatch();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const stage = stageWatch.query.data;
  const stages = stageListWatch.data.array;

  const isLoaded = !stageWatch.query.isLoading && !stageListWatch.query.isLoading && !cdPipelineWatch.query.isLoading;

  if (!isLoaded || !stage || !stages) {
    return null;
  }

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="More options">
          Actions
          <EllipsisVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <StageActionsMenu
        data={{
          stages,
          stage,
        }}
        backRoute={{
          to: PATH_CDPIPELINE_DETAILS_FULL,
          params: {
            clusterName: params.clusterName,
            name: params.cdPipeline,
            namespace: params.namespace,
          },
        }}
        variant="menu"
      />
    </DropdownMenu>
  );
};

export const HeaderLinks = () => {
  const params = routeStageDetails.useParams();
  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();
  const stageWatch = useStageWatch();

  const stage = stageWatch.query.data;
  const quickLinksUrls = quickLinksUrlListWatch.data?.quickLinkURLs;
  const quickLinks = quickLinksUrlListWatch.data?.quickLinkList;

  const monitoringQuickLink = quickLinks?.find((el) => el.metadata.name === systemQuickLink.monitoring);
  const loggingQuickLink = quickLinks?.find((el) => el.metadata.name === systemQuickLink.logging);

  return (
    <div className="flex items-center gap-1">
      <QuickLink
        name={quickLinkUiNames[systemQuickLink.argocd]}
        href={LinkCreationService.argocd.createStageLink(
          quickLinksUrls?.[systemQuickLink.argocd],
          params.cdPipeline,
          params.stage
        )}
        setupAction={
          <Link to={PATH_CONFIG_ARGOCD_FULL} params={{ clusterName: params.clusterName }}>
            here
          </Link>
        }
        display="text"
        variant="link"
        size="xs"
      />
      <QuickLink
        name={quickLinkUiNames[systemQuickLink.monitoring]}
        tooltip="monitoring dashboard"
        icon={monitoringQuickLink?.spec?.icon}
        href={LinkCreationService.monitoring.createDashboardLink({
          provider: monitoringQuickLink?.metadata?.labels?.[quickLinkLabels.provider],
          baseURL: quickLinksUrls?.[systemQuickLink.monitoring],
          namespace: params.namespace,
          clusterName: stage?.spec.clusterName,
        })}
        display="text"
        variant="link"
        size="xs"
      />
      <QuickLink
        name={quickLinkUiNames[systemQuickLink.logging]}
        tooltip="logging dashboard"
        icon={loggingQuickLink?.spec?.icon}
        href={LinkCreationService.logging.createDashboardLink({
          provider: loggingQuickLink?.metadata?.labels?.[quickLinkLabels.provider],
          baseURL: quickLinksUrls?.[systemQuickLink.logging],
          namespace: params.namespace,
          clusterName: stage?.spec.clusterName,
        })}
        display="text"
        variant="link"
        size="xs"
      />
    </div>
  );
};
