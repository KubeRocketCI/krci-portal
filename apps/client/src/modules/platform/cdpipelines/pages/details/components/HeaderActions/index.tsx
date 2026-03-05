import { QuickLink } from "@/core/components/QuickLink";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { CDPipelineActionsMenu } from "@/modules/platform/cdpipelines/components/CDPipelineActionsMenu";
import { PATH_CONFIG_SONAR_FULL } from "@/modules/platform/configuration/modules/sonar/route";
import { systemQuickLink } from "@my-project/shared";
import { PATH_CDPIPELINES_FULL } from "../../../list/route";
import { routeCDPipelineDetails } from "../../route";
import { useCDPipelineWatch, useQuickLinksUrlListWatch } from "../../hooks/data";
import { CreateEnvironmentButton } from "../CreateEnvironmentButton";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { Button } from "@/core/components/ui/button";
import { EllipsisVertical } from "lucide-react";
import { Link } from "@tanstack/react-router";
import React from "react";

export const HeaderActions = () => {
  const cdPipelineWatch = useCDPipelineWatch();
  const cdPipeline = cdPipelineWatch.query.data;
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <>
      <CreateEnvironmentButton />
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label="More options">
            Actions
            <EllipsisVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <CDPipelineActionsMenu
          data={{
            CDPipeline: cdPipeline!,
          }}
          backRoute={{
            to: PATH_CDPIPELINES_FULL,
          }}
          variant="menu"
        />
      </DropdownMenu>
    </>
  );
};

export const HeaderLinks = () => {
  const params = routeCDPipelineDetails.useParams();
  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();
  const quickLinksURLs = quickLinksUrlListWatch.data?.quickLinkURLs;

  return (
    <QuickLink
      name={quickLinkUiNames[systemQuickLink.argocd]}
      href={LinkCreationService.argocd.createPipelineLink(quickLinksURLs?.[systemQuickLink.argocd], params.name)}
      setupAction={
        <Link to={PATH_CONFIG_SONAR_FULL} params={{ clusterName: params.clusterName }}>
          here
        </Link>
      }
      display="text"
      variant="link"
      size="xs"
    />
  );
};
