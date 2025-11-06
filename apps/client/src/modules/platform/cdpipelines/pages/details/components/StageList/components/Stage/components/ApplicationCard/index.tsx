import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { Badge } from "@/core/components/ui/badge";
import { ApplicationCardProps } from "./types";
import { getApplicationStatusIcon, getApplicationSyncStatusIcon } from "@/k8s/api/groups/ArgoCD/Application";
import { Application, applicationLabels, inClusterName, systemQuickLink } from "@my-project/shared";
import { FileTerminal, Terminal } from "lucide-react";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { TooltipWithLinkList } from "@/core/components/TooltipWithLinkList";
import { StatusIcon } from "@/core/components/StatusIcon";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Link } from "@tanstack/react-router";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { QuickLink } from "@/core/components/QuickLink";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { PATH_CONFIG_ARGOCD_FULL } from "@/modules/platform/configuration/modules/argocd/route";
import { Button } from "@/core/components/ui/button";
import { PATH_COMPONENT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import moment from "moment";
import { useQuickLinksUrlListWatch } from "@/modules/platform/cdpipelines/pages/details/hooks/data";

const formatDate = (date: string): string => {
  const formattedDate: string = moment(date).format("MM/DD/YYYY HH:mm:ss");
  const timeAgo: string = moment(date).fromNow();
  return `${formattedDate} (${timeAgo})`;
};

export const ApplicationCard = ({
  stage,
  application,
  argoApplication,
  QuickLinksURLS,
  stagePods,
  viewMode,
}: ApplicationCardProps) => {
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

  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();

  const argocdQuickLink = quickLinksUrlListWatch.data?.quickLinkList?.find(
    (el) => el.metadata.name === systemQuickLink.argocd
  );

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

  const [expanded, setExpanded] = React.useState<string | undefined>(() =>
    viewMode === VIEW_MODES.DETAILED ? "panel1" : undefined
  );

  const handleChange = React.useCallback((value: string) => {
    setExpanded(value === "" ? undefined : value);
  }, []);

  React.useEffect(() => {
    setExpanded(viewMode === VIEW_MODES.DETAILED ? "panel1" : undefined);
  }, [viewMode]);

  const argoAppExternalURLs = argoApplication?.status?.summary?.externalURLs;

  return (
    <Accordion
      key={viewMode}
      type="single"
      collapsible
      value={expanded}
      onValueChange={handleChange}
      defaultValue={viewMode === VIEW_MODES.DETAILED ? "panel1" : undefined}
    >
      <AccordionItem value="panel1">
        <AccordionTrigger
          className={`min-h-0 ${viewMode === VIEW_MODES.COMPACT ? "cursor-pointer" : "cursor-default"}`}
        >
          <div className="flex w-full min-w-0 flex-row items-center justify-between gap-4 pr-4">
            <div className="flex min-w-0 flex-row items-center gap-4">
              <StatusIcon
                Title={`Health status: ${argoAppHealthStatus || "Unknown"}`}
                Icon={applicationHealthStatusIcon.component}
                color={applicationHealthStatusIcon.color}
                isSpinning={applicationHealthStatusIcon.isSpinning}
              />
              <Button variant="link" asChild className="p-0 text-xl">
                <Link
                  to={PATH_COMPONENT_DETAILS_FULL}
                  params={{
                    clusterName,
                    name: application.metadata.name,
                    namespace: application.metadata.namespace || defaultNamespace,
                  }}
                >
                  <TextWithTooltip text={application.metadata.name} className="text-base" />
                </Link>
              </Button>
            </div>
            <TextWithTooltip
              text={argoApplication?.spec.source?.targetRevision ?? "Unknown"}
              className="text-xs font-light"
            />
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-2">
            <div className="flex shrink-0 flex-row items-center gap-2">
              <span className="text-muted-foreground text-xs">Open In:</span>
              <div className="flex flex-row gap-2">
                <QuickLink
                  name={{
                    label: quickLinkUiNames[systemQuickLink.argocd],
                    value: systemQuickLink.argocd,
                  }}
                  iconBase64={argocdQuickLink?.spec.icon}
                  externalLink={_createArgoCDLink(argoApplication)}
                  configurationRoute={{
                    to: PATH_CONFIG_ARGOCD_FULL,
                    params: {
                      clusterName,
                    },
                  }}
                  size="sm"
                />
              </div>
            </div>
            <div className="flex flex-row items-center gap-4">
              <span className="text-muted-foreground text-xs">Sync status:</span>
              <StatusIcon
                Title={`Sync status: ${argoAppSyncStatus || "Unknown"}`}
                Icon={applicationSyncStatusIcon.component}
                color={applicationSyncStatusIcon.color}
                isSpinning={applicationSyncStatusIcon.isSpinning}
              />
            </div>
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="flex flex-row items-center gap-4">
                <span className="text-muted-foreground text-xs">Created:</span>
                <Badge variant="secondary" className="min-w-0 h-5 leading-none pt-0.5 bg-purple-50">
                  {argoApplication ? formatDate(argoApplication?.metadata.creationTimestamp) : "Unknown"}
                </Badge>
              </div>
              {argoAppExternalURLs && <TooltipWithLinkList urls={argoAppExternalURLs} size="small" />}
            </div>

            {!isExternalCluster && (
              <div className="flex flex-row items-center justify-end gap-2">
                <ConditionalWrapper
                  condition={podButtonDisabled.status}
                  wrapper={(children) => (
                    <Tooltip title={podButtonDisabled.reason}>
                      <div>{children}</div>
                    </Tooltip>
                  )}
                >
                  <Button
                    variant="ghost"
                    className="text-secondary-dark hover:bg-secondary-dark/10"
                    // onClick={() =>
                    //   setDialog(PodsLogViewerDialog, {
                    //     pods: applicationPods,
                    //   })
                    // }
                    disabled={podButtonDisabled.status}
                  >
                    <FileTerminal size={16} />
                    logs
                  </Button>
                </ConditionalWrapper>
                <ConditionalWrapper
                  condition={podButtonDisabled.status}
                  wrapper={(children) => (
                    <Tooltip title={podButtonDisabled.reason}>
                      <div>{children}</div>
                    </Tooltip>
                  )}
                >
                  <Button
                    variant="ghost"
                    className="text-secondary-dark hover:bg-secondary-dark/10"
                    // onClick={() =>
                    //   setDialog(PodsTerminalDialog, {
                    //     pods: applicationPods,
                    //   })
                    // }
                    disabled={podButtonDisabled.status}
                  >
                    <Terminal size={16} />
                    terminal
                  </Button>
                </ConditionalWrapper>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
