import { QuickLink } from "@/core/components/QuickLink";
import { quickLinkLabels } from "@/core/k8s/api/groups/KRCI/QuickLink/constants";
import { LinkCreationService } from "@/core/services/link-creation";
import { routeSonarConfiguration } from "@/modules/platform/configuration/pages/sonar/route";
import { systemQuickLink } from "@my-project/shared";
import { Grid } from "@mui/material";

export const HeaderActions = () => {
  return (
    <Grid container alignItems="center" spacing={1}>
      <Grid item>
        {/* <QuickLink
          name={{
            label: quickLinkLabels[systemQuickLink.argocd],
            value: systemQuickLink.argocd,
          }}
          icon={ICONS.ARGOCD}
          externalLink={LinkCreationService.argocd.createPipelineLink(
            quickLinksURLs.data?.[systemQuickLink.argocd],
            name
          )}
          configurationRoute={routeSonarConfiguration}
          isTextButton
        /> */}
      </Grid>
      <>
        {/* <Grid item>
          <LoadingWrapper isLoading={CDPipeline.isLoading}>
            <CDPipelineActionsMenu
              data={{
                CDPipelineData: CDPipeline.data!,
              }}
              backRoute={Router.createRouteURL(routeCDPipelineList.path)}
              variant="inline"
            />
          </LoadingWrapper>
        </Grid> */}
      </>
    </Grid>
  );
};
