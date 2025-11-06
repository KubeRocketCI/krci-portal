import { QuickLink } from "@/core/components/QuickLink";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Button } from "@/core/components/ui/button";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { getStageStatusIcon } from "@/k8s/api/groups/KRCI/Stage";
import { useViewModeContext } from "@/core/providers/ViewMode/hooks";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { useClusterStore } from "@/k8s/store";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { getApplicationStatus, quickLinkLabels, systemQuickLink } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { routeCDPipelineDetails } from "../../../../route";
import { ApplicationCard } from "./components/ApplicationCard";
import { Badge } from "@/core/components/ui/badge";
import { cn } from "@/core/utils/classname";
import { EnvironmentStageProps } from "./types";
import { useQuickLinksUrlListWatch } from "../../../../hooks/data";
import { useStageFilter } from "../../../StageListFilter/hooks/useStageFilter";

export const Stage = ({ stageWithApplications: { stage, applications } }: EnvironmentStageProps) => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const params = routeCDPipelineDetails.useParams();

  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();

  const { viewMode } = useViewModeContext();

  const monitoringQuickLink = quickLinksUrlListWatch.data?.quickLinkList?.find(
    (el) => el.metadata.name === systemQuickLink.monitoring
  );
  const loggingQuickLink = quickLinksUrlListWatch.data?.quickLinkList?.find(
    (el) => el.metadata.name === systemQuickLink.logging
  );

  const argocdQuickLink = quickLinksUrlListWatch.data?.quickLinkList?.find(
    (el) => el.metadata.name === systemQuickLink.argocd
  );

  const stageIsLoaded = stage?.status;

  const stageStatusIcon = getStageStatusIcon(stage);

  const { form } = useStageFilter();

  const filteredApplications = React.useMemo(() => {
    const formValues = form.state.values;
    const applicationValues = formValues.application;
    const healthValue = formValues.health;

    let _applications = [...applications];

    if (applicationValues && Array.isArray(applicationValues)) {
      _applications = _applications.filter((el) =>
        applicationValues.length === 0 ? true : applicationValues.includes(el.appCodebase.metadata.name)
      );
    }

    if (healthValue) {
      _applications = _applications.filter(
        (el) => getApplicationStatus(el.argoApplication).status === healthValue || healthValue === "All"
      );
    }

    return _applications;
  }, [applications, form.state.values]);

  const renderArgoCDQuickLink = React.useCallback(() => {
    const baseURL = quickLinksUrlListWatch.data?.quickLinkURLs?.[systemQuickLink.argocd];
    const clusterName = stage.spec.clusterName;

    return (
      quickLinksUrlListWatch.data?.quickLinkURLs && (
        <QuickLink
          name={{
            label: quickLinkUiNames[systemQuickLink.argocd],
            value: systemQuickLink.argocd,
          }}
          iconBase64={argocdQuickLink?.spec?.icon}
          enabledText="Open ArgoCD"
          externalLink={LinkCreationService.argocd.createStageLink(baseURL, params.name, clusterName)}
          quickLink={argocdQuickLink}
          size="sm"
        />
      )
    );
  }, [quickLinksUrlListWatch.data?.quickLinkURLs, stage.spec.clusterName, argocdQuickLink, params.name]);

  const renderMonitoringQuickLink = React.useCallback(() => {
    const provider = monitoringQuickLink?.metadata?.labels?.[quickLinkLabels.provider];
    const baseURL = quickLinksUrlListWatch.data?.quickLinkURLs?.[systemQuickLink.monitoring];
    const namespace = stage.spec.namespace;
    const clusterName = stage.spec.clusterName;

    return (
      quickLinksUrlListWatch.data?.quickLinkURLs && (
        <QuickLink
          name={{
            label: quickLinkUiNames[systemQuickLink.monitoring],
            value: systemQuickLink.monitoring,
          }}
          iconBase64={monitoringQuickLink?.spec?.icon}
          enabledText="Open Metrics"
          externalLink={LinkCreationService.monitoring.createDashboardLink({
            provider,
            baseURL,
            namespace,
            clusterName,
          })}
          quickLink={monitoringQuickLink}
          size="sm"
        />
      )
    );
  }, [monitoringQuickLink, quickLinksUrlListWatch.data?.quickLinkURLs, stage.spec.clusterName, stage.spec.namespace]);

  const renderLoggingQuickLink = React.useCallback(() => {
    const provider = loggingQuickLink?.metadata?.labels?.[quickLinkLabels.provider];
    const baseURL = quickLinksUrlListWatch.data?.quickLinkURLs?.[systemQuickLink.logging];
    const namespace = stage.spec.namespace;
    const clusterName = stage.spec.clusterName;

    return (
      quickLinksUrlListWatch.data?.quickLinkURLs && (
        <QuickLink
          name={{
            label: quickLinkUiNames[systemQuickLink.logging],
            value: systemQuickLink.logging,
          }}
          iconBase64={loggingQuickLink?.spec?.icon}
          enabledText="Open Logs"
          externalLink={LinkCreationService.logging.createDashboardLink({
            provider,
            baseURL,
            namespace,
            clusterName,
          })}
          quickLink={loggingQuickLink}
          size="sm"
        />
      )
    );
  }, [loggingQuickLink, quickLinksUrlListWatch.data?.quickLinkURLs, stage.spec.clusterName, stage.spec.namespace]);

  return (
    <div className="w-full rounded bg-purple-50 p-4 px-8">
      <LoadingWrapper isLoading={!stageIsLoaded}>
        <div className="flex flex-col gap-4">
          <div
            className={cn(
              "border-border bg-card relative border border-r-0 px-6 py-2.5",
              "w-[calc(100%-1rem)] drop-shadow-[0px_0_5px_#0024461F]",
              "before:clip-[polygon(0_0,0%_100%,100%_50%)] before:absolute before:top-0 before:bottom-0 before:left-full before:-ml-px before:h-full before:w-8 before:bg-inherit before:content-['']"
            )}
            style={
              stageStatusIcon.color
                ? ({ borderLeftWidth: "5px", borderLeftColor: stageStatusIcon.color } as React.CSSProperties)
                : undefined
            }
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-row justify-between gap-4">
                <div className="flex flex-row items-center gap-2">
                  <Button variant="link" asChild className="p-0 text-2xl font-medium">
                    <Link
                      to={PATH_CDPIPELINE_STAGE_DETAILS_FULL}
                      params={{
                        clusterName,
                        cdPipeline: params.name,
                        namespace: params.namespace,
                        stage: stage.spec.name,
                      }}
                    >
                      {stage.spec.name.toUpperCase()}
                    </Link>
                  </Button>{" "}
                  <span className="text-muted-foreground text-xs">({stage.spec.clusterName})</span>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <span className="text-foreground text-xs">Open In:</span>
                  <div className="flex flex-row gap-2">
                    {renderArgoCDQuickLink()}
                    {renderMonitoringQuickLink()}
                    {renderLoggingQuickLink()}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2">
                  <span className="text-foreground text-xs">Namespace:</span>
                  <Badge variant="secondary" className="h-5 min-w-0 bg-purple-50 pt-0.5 leading-none">
                    <TextWithTooltip text={stage.spec.namespace} />
                  </Badge>
                </div>
                <div className="flex flex-row gap-2">
                  <span className="text-foreground text-xs">Trigger Type:</span>
                  <Badge variant="secondary" className="h-5 min-w-0 bg-purple-50 pt-0.5 leading-none">
                    <TextWithTooltip text={stage.spec.triggerType} />
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5">
            <div className="flex flex-col gap-4">
              <LoadingWrapper isLoading={quickLinksUrlListWatch.isLoading}>
                {filteredApplications.map((el) => {
                  const key = el.argoApplication?.metadata.name;

                  return el.argoApplication ? (
                    <ApplicationCard
                      key={key}
                      stage={stage}
                      application={el.appCodebase}
                      argoApplication={el.argoApplication}
                      QuickLinksURLS={quickLinksUrlListWatch.data?.quickLinkURLs || {}}
                      stagePods={[]}
                      viewMode={viewMode}
                    />
                  ) : null;
                })}
              </LoadingWrapper>
            </div>
          </div>
        </div>
      </LoadingWrapper>
    </div>
  );
};
