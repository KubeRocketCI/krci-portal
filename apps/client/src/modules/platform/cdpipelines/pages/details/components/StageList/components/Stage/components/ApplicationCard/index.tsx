import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button as MuiButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import React from "react";
import { StyledChip } from "../../styles";
import { ApplicationCardProps } from "./types";
import { getApplicationStatusIcon, getApplicationSyncStatusIcon } from "@/core/k8s/api/groups/ArgoCD/Application";
import { Application, applicationLabels, inClusterName, systemQuickLink } from "@my-project/shared";
import { ChevronDown, FileTerminal, Terminal } from "lucide-react";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { TooltipWithLinkList } from "@/core/components/TooltipWithLinkList";
import { StatusIcon } from "@/core/components/StatusIcon";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import { LinkCreationService } from "@/core/services/link-creation";
import { routeComponentDetails } from "@/modules/platform/codebases/pages/details/route";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Link } from "@tanstack/react-router";
import { useClusterStore } from "@/core/store";
import { useShallow } from "zustand/react/shallow";
import { QuickLink } from "@/core/components/QuickLink";
import { quickLinkUiNames } from "@/core/k8s/api/groups/KRCI/QuickLink/constants";
import { routeArgocdConfiguration } from "@/modules/platform/configuration/pages/argocd/route";
import { Button } from "@/core/components/ui/button";

// const formatDate = (date: string): string => {
//   const formattedDate: string = moment(date).format("MM/DD/YYYY HH:mm:ss");
//   const timeAgo: string = moment(date).fromNow();
//   return `${formattedDate} (${timeAgo})`;
// };

export const ApplicationCard = ({
  stage,
  application,
  argoApplication,
  QuickLinksURLS,
  stagePods,
  viewMode,
}: ApplicationCardProps) => {
  const theme = useTheme();

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const argoAppHealthStatus = argoApplication?.status?.health?.status;
  const argoAppSyncStatus = argoApplication?.status?.sync?.status;

  const applicationHealthStatusIcon = getApplicationStatusIcon(argoApplication);
  const applicationSyncStatusIcon = getApplicationSyncStatusIcon(argoApplication);

  // const { setDialog } = useDialogOpener();

  const _createArgoCDLink = React.useCallback(
    (argoApplication: Application) =>
      LinkCreationService.argocd.createApplicationLink(
        QuickLinksURLS?.[systemQuickLink.argocd],
        argoApplication?.metadata?.labels?.[applicationLabels.pipeline],
        argoApplication?.metadata?.labels?.[applicationLabels.stage],
        argoApplication?.metadata?.labels?.[applicationLabels.appName]
      ),
    [QuickLinksURLS]
  );

  const isExternalCluster = stage.spec.clusterName !== inClusterName;

  const applicationPods = React.useMemo(() => {
    if (!stagePods || !stagePods.length || !argoApplication) {
      return [];
    }
    // return stagePods.reduce((acc, pod) => {
    //   if (
    //     pod.metadata?.labels?.["app.kubernetes.io/instance"] ===
    //     argoApplication.metadata?.labels?.[APPLICATION_LABEL_SELECTOR_APP_NAME]
    //   ) {
    //     //@ts-ignore
    //     acc.push(new PodKubeObject(pod));
    //   }
    //   return acc;
    // }, []);
  }, [argoApplication, stagePods]);

  const podButtonDisabled = React.useMemo(() => {
    if (!argoApplication) {
      return {
        status: true,
        reason: "Could not find ArgoCD Application for this application",
      };
    }

    if (!applicationPods || !applicationPods.length) {
      return {
        status: true,
        reason: "Could not find Pods for this application",
      };
    }

    return {
      status: false,
    };
  }, [argoApplication, applicationPods]);

  const [expanded, setExpanded] = React.useState<string | false>(() =>
    viewMode === VIEW_MODES.DETAILED ? "panel1" : false
  );

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  React.useEffect(() => {
    setExpanded(viewMode === VIEW_MODES.DETAILED ? "panel1" : false);
  }, [viewMode]);

  const argoAppExternalURLs = argoApplication?.status?.summary?.externalURLs;

  return (
    <Accordion
      key={viewMode}
      defaultExpanded={viewMode === VIEW_MODES.DETAILED}
      expanded={expanded === "panel1"}
      onChange={handleChange("panel1")}
    >
      <AccordionSummary
        expandIcon={viewMode === VIEW_MODES.COMPACT ? <ChevronDown size={20} /> : null}
        sx={{
          padding: (t) => `${t.typography.pxToRem(8)} ${t.typography.pxToRem(24)}`,
          minHeight: "auto !important",
          cursor: viewMode === VIEW_MODES.COMPACT ? "pointer" : "default",

          "& .MuiAccordionSummary-content": {
            minWidth: 0,
            margin: 0,
          },
          "& .MuiAccordionSummary-content.Mui-expanded": {
            margin: 0,
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ minWidth: 0, width: "100%", pr: theme.typography.pxToRem(16) }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            <StatusIcon
              Title={`Health status: ${argoAppHealthStatus || "Unknown"}`}
              Icon={applicationHealthStatusIcon.component}
              color={applicationHealthStatusIcon.color}
              isSpinning={applicationHealthStatusIcon.isSpinning}
            />
            <Button variant="link" asChild className="p-0 text-xl">
              <Link
                to={routeComponentDetails.to}
                params={{
                  clusterName,
                  name: application.metadata.name,
                  namespace: application.metadata.namespace || defaultNamespace,
                }}
              >
                <TextWithTooltip
                  text={application.metadata.name}
                  textSX={{
                    fontSize: theme.typography.pxToRem(16),
                  }}
                />
              </Link>
            </Button>
          </Stack>
          <TextWithTooltip
            text={argoApplication?.spec.source?.targetRevision ?? "Unknown"}
            textSX={{
              fontSize: theme.typography.pxToRem(12),
              fontWeight: 300,
            }}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
            <Typography variant="caption" color="primary.dark">
              Open In:
            </Typography>
            <Stack direction="row" spacing={1}>
              <QuickLink
                name={{
                  label: quickLinkUiNames[systemQuickLink.argocd],
                  value: systemQuickLink.argocd,
                }}
                // icon={ICONS.ARGOCD}
                externalLink={_createArgoCDLink(argoApplication)}
                configurationRoute={{
                  to: routeArgocdConfiguration.to,
                  params: {
                    clusterName,
                  },
                }}
                size="small"
              />
            </Stack>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="caption" color="primary.dark">
              Sync status:
            </Typography>
            <StatusIcon
              Title={`Sync status: ${argoAppSyncStatus || "Unknown"}`}
              Icon={applicationSyncStatusIcon.component}
              color={applicationSyncStatusIcon.color}
              isSpinning={applicationSyncStatusIcon.isSpinning}
            />
          </Stack>
          <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="caption" color="primary.dark">
                Created:
              </Typography>
              <StyledChip
                // label={argoApplication ? formatDate(argoApplication?.metadata.creationTimestamp) : "Unknown"}
                label="TEMPORARY"
              />
            </Stack>
            {argoAppExternalURLs && <TooltipWithLinkList urls={argoAppExternalURLs} size="small" />}
          </Stack>

          {!isExternalCluster && (
            <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1}>
              <ConditionalWrapper
                condition={podButtonDisabled.status}
                wrapper={(children) => (
                  <Tooltip title={podButtonDisabled.reason}>
                    <div>{children}</div>
                  </Tooltip>
                )}
              >
                <MuiButton
                  variant="text"
                  sx={{ color: theme.palette.secondary.dark }}
                  // onClick={() =>
                  //   setDialog(PodsLogViewerDialog, {
                  //     pods: applicationPods,
                  //   })
                  // }
                  disabled={podButtonDisabled.status}
                  endIcon={<FileTerminal size={16} />}
                >
                  logs
                </MuiButton>
              </ConditionalWrapper>
              <ConditionalWrapper
                condition={podButtonDisabled.status}
                wrapper={(children) => (
                  <Tooltip title={podButtonDisabled.reason}>
                    <div>{children}</div>
                  </Tooltip>
                )}
              >
                <MuiButton
                  variant="text"
                  sx={{ color: theme.palette.secondary.dark }}
                  // onClick={() =>
                  //   setDialog(PodsTerminalDialog, {
                  //     pods: applicationPods,
                  //   })
                  // }
                  disabled={podButtonDisabled.status}
                  endIcon={<Terminal size={16} />}
                >
                  terminal
                </MuiButton>
              </ConditionalWrapper>
            </Stack>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};
