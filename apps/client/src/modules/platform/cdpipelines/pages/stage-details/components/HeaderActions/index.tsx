import { QuickLink } from "@/core/components/QuickLink";
import { quickLinkUiNames } from "@/core/k8s/api/groups/KRCI/QuickLink/constants";
import { LinkCreationService } from "@/core/services/link-creation";
import { StageActionsMenu } from "@/modules/platform/cdpipelines/components/StageActionsMenu";
import { Box, Stack } from "@mui/material";
import { quickLinkLabels, systemQuickLink } from "@my-project/shared";
import { routeStageDetails } from "../../route";
import { routeArgocdConfiguration } from "@/modules/platform/configuration/pages/argocd/route";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { routeCDPipelineDetails } from "../../../details/route";
import { useQuickLinksUrlListWatch, useStageListWatch, useCDPipelineWatch, useStageWatch } from "../../hooks";

export const HeaderActions = () => {
  const params = routeStageDetails.useParams();
  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();
  const stageWatch = useStageWatch();
  const stageListWatch = useStageListWatch();
  const cdPipelineWatch = useCDPipelineWatch();

  const stage = stageWatch.query.data;
  const stages = stageListWatch.dataArray;
  const cdPipeline = cdPipelineWatch.query.data;

  const quickLinksUrls = quickLinksUrlListWatch.data?.quickLinkURLs;
  const quickLinks = quickLinksUrlListWatch.data?.quickLinkList;

  const monitoringQuickLink = quickLinks?.find((el) => el.metadata.name === systemQuickLink.monitoring);
  const loggingQuickLink = quickLinks?.find((el) => el.metadata.name === systemQuickLink.logging);

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <QuickLink
        name={{
          label: quickLinkUiNames[systemQuickLink.argocd],
          value: systemQuickLink.argocd,
        }}
        externalLink={LinkCreationService.argocd.createStageLink(
          quickLinksUrls?.[systemQuickLink.argocd],
          params.cdPipeline,
          params.stage
        )}
        configurationRoute={{
          to: routeArgocdConfiguration.to,
          params: {
            name: params.cdPipeline,
            namespace: params.namespace,
          },
        }}
        isTextButton
      />
      <QuickLink
        name={{
          label: quickLinkUiNames[systemQuickLink.monitoring],
          value: systemQuickLink.monitoring,
        }}
        enabledText="monitoring dashboard"
        iconBase64={monitoringQuickLink?.spec?.icon}
        externalLink={LinkCreationService.monitoring.createDashboardLink({
          provider: monitoringQuickLink?.metadata?.labels?.[quickLinkLabels.provider],
          baseURL: quickLinksUrls?.[systemQuickLink.monitoring],
          namespace: params.namespace,
          clusterName: stage?.spec.clusterName,
        })}
        isTextButton
      />
      <QuickLink
        name={{
          label: quickLinkUiNames[systemQuickLink.logging],
          value: systemQuickLink.logging,
        }}
        enabledText="logging dashboard"
        iconBase64={loggingQuickLink?.spec?.icon}
        externalLink={LinkCreationService.logging.createDashboardLink({
          provider: loggingQuickLink?.metadata?.labels?.[quickLinkLabels.provider],
          baseURL: quickLinksUrls?.[systemQuickLink.logging],
          namespace: params.namespace,
          clusterName: stage?.spec.clusterName,
        })}
        isTextButton
      />
      <Box sx={{ ml: (t) => t.typography.pxToRem(20) }}>
        <LoadingWrapper
          isLoading={stageWatch.query.isLoading && stageListWatch.query.isLoading && cdPipelineWatch.query.isLoading}
        >
          <StageActionsMenu
            data={{
              stages: stages!,
              stage: stage!,
              cdPipeline: cdPipeline!,
            }}
            backRoute={{
              to: routeCDPipelineDetails.to,
              params: {
                clusterName: params.clusterName,
                name: params.cdPipeline,
                namespace: params.namespace,
              },
            }}
            variant="inline"
          />
        </LoadingWrapper>
      </Box>
    </Stack>
  );
};
