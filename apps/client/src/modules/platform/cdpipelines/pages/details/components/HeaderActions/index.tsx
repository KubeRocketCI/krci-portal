import { QuickLink } from "@/core/components/QuickLink";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { CDPipelineActionsMenu } from "@/modules/platform/cdpipelines/components/CDPipelineActionsMenu";
import { routeSonarConfiguration } from "@/modules/platform/configuration/modules/sonar/route";
import { Grid } from "@mui/material";
import { systemQuickLink } from "@my-project/shared";
import { routeCDPipelineList } from "../../../list/route";
import { routeCDPipelineDetails } from "../../route";
import { useCDPipelineWatch, useQuickLinksUrlListWatch } from "../../hooks/data";

export const HeaderActions = () => {
  const { name } = routeCDPipelineDetails.useParams();
  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();
  const cdPipelineWatch = useCDPipelineWatch();

  const cdPipeline = cdPipelineWatch.query.data;
  const quickLinksURLs = quickLinksUrlListWatch.data?.quickLinkURLs;

  return (
    <Grid container alignItems="center" spacing={1}>
      <Grid item>
        <QuickLink
          name={{
            label: quickLinkUiNames[systemQuickLink.argocd],
            value: systemQuickLink.argocd,
          }}
          externalLink={LinkCreationService.argocd.createPipelineLink(quickLinksURLs?.[systemQuickLink.argocd], name)}
          configurationRoute={{
            to: routeSonarConfiguration.to,
          }}
          isTextButton
        />
      </Grid>
      <>
        <Grid item>
          <CDPipelineActionsMenu
            data={{
              CDPipeline: cdPipeline!,
            }}
            backRoute={{
              to: routeCDPipelineList.to,
            }}
            variant="inline"
          />
        </Grid>
      </>
    </Grid>
  );
};
