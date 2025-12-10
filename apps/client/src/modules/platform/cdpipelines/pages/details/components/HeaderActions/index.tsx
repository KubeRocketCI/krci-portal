import { QuickLink } from "@/core/components/QuickLink";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { CDPipelineActionsMenu } from "@/modules/platform/cdpipelines/components/CDPipelineActionsMenu";
import { PATH_CONFIG_SONAR_FULL } from "@/modules/platform/configuration/modules/sonar/route";
import { systemQuickLink } from "@my-project/shared";
import { PATH_CDPIPELINES_FULL } from "../../../list/route";
import { routeCDPipelineDetails } from "../../route";
import { useCDPipelineWatch, useQuickLinksUrlListWatch } from "../../hooks/data";

export const HeaderActions = () => {
  const cdPipelineWatch = useCDPipelineWatch();
  const cdPipeline = cdPipelineWatch.query.data;

  return (
    <CDPipelineActionsMenu
      data={{
        CDPipeline: cdPipeline!,
      }}
      backRoute={{
        to: PATH_CDPIPELINES_FULL,
      }}
      variant="inline"
    />
  );
};

export const HeaderLinks = () => {
  const { name } = routeCDPipelineDetails.useParams();
  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();
  const quickLinksURLs = quickLinksUrlListWatch.data?.quickLinkURLs;

  return (
    <div className="flex items-center gap-1">
      <QuickLink
        name={{
          label: quickLinkUiNames[systemQuickLink.argocd],
          value: systemQuickLink.argocd,
        }}
        externalLink={LinkCreationService.argocd.createPipelineLink(quickLinksURLs?.[systemQuickLink.argocd], name)}
        configurationRoute={{
          to: PATH_CONFIG_SONAR_FULL,
        }}
        isTextButton
        variant="link"
      />
    </div>
  );
};
