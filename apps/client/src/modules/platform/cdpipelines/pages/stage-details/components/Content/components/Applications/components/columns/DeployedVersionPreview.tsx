import {
  CODEBASE_COMMON_BUILD_TOOLS,
  CODEBASE_COMMON_FRAMEWORKS,
  CODEBASE_COMMON_LANGUAGES,
} from "@/core/k8s/api/groups/KRCI/Codebase/configs/mappings";
import { quickLinkUiNames } from "@/core/k8s/api/groups/KRCI/QuickLink/constants";
import { LinkCreationService } from "@/core/services/link-creation";
import { useQuickLinksUrlListWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { Box, Grid, Tooltip } from "@mui/material";
import { Application, applicationLabels, Codebase, getDeployedVersion, systemQuickLink } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { SquareArrowOutUpRight } from "lucide-react";
import React from "react";

export const DeployedVersionPreviewColumn = ({
  appCodebase,
  application,
}: {
  appCodebase: Codebase;
  application: Application;
}) => {
  const { lang, framework, buildTool } = appCodebase.spec;

  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();

  const quickLinkURLs = quickLinksUrlListWatch.data?.quickLinkURLs;

  const isHelm =
    lang === CODEBASE_COMMON_LANGUAGES.HELM &&
    framework === CODEBASE_COMMON_FRAMEWORKS.HELM &&
    buildTool === CODEBASE_COMMON_BUILD_TOOLS.HELM;

  const withValuesOverride = application ? Object.hasOwn(application?.spec, "sources") : false;

  const deployedVersion = getDeployedVersion(withValuesOverride, isHelm, application);

  const argoCDLink = React.useMemo(() => {
    return LinkCreationService.argocd.createApplicationLink(
      quickLinkURLs?.[systemQuickLink.argocd],
      application.metadata?.labels?.[applicationLabels.pipeline],
      application.metadata?.labels?.[applicationLabels.stage],
      application.metadata?.labels?.[applicationLabels.appName]
    );
  }, [application.metadata?.labels, quickLinkURLs]);

  return application && deployedVersion !== "NaN" ? (
    <Tooltip
      title={
        <Grid container alignItems={"center"} spacing={1}>
          <Grid item>Open in {quickLinkUiNames[systemQuickLink.argocd]}</Grid>
          <span> </span>
          <Grid item>
            <SquareArrowOutUpRight size={16} />
          </Grid>
        </Grid>
      }
    >
      <Box sx={{ m: "2px 0" }}>
        <Link to={argoCDLink} target={"_blank"}>
          {deployedVersion}
        </Link>
      </Box>
    </Tooltip>
  ) : (
    "No deploy"
  );
};
