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
import { StyledCardBody, StyledCardHeader, StyledCardWrapper, StyledChip } from "./styles";
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
          size="small"
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
          size="small"
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
          size="small"
        />
      )
    );
  }, [loggingQuickLink, quickLinksUrlListWatch.data?.quickLinkURLs, stage.spec.clusterName, stage.spec.namespace]);

  return (
    <StyledCardWrapper>
      <LoadingWrapper isLoading={!stageIsLoaded}>
        <div className="flex flex-col gap-4">
          <StyledCardHeader stageStatusColor={stageStatusIcon.color} variant="outlined">
            <div className="flex flex-col gap-2">
              <div className="flex gap-4 justify-between flex-row">
                <div className="flex flex-row gap-2 items-center">
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
                  <span className="text-xs text-muted-foreground">
                      ({stage.spec.clusterName})
                  </span>
                </div>
                <div className="flex flex-row gap-2 items-center">
                  <span className="text-xs text-foreground">
                    Open In:
                  </span>
                  <div className="flex flex-row gap-2">
                    {renderArgoCDQuickLink()}
                    {renderMonitoringQuickLink()}
                    {renderLoggingQuickLink()}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 flex-row">
                  <span className="text-xs text-foreground">
                    Namespace:
                  </span>
                  <StyledChip label={<TextWithTooltip text={stage.spec.namespace} />} />
                </div>
                <div className="flex gap-2 flex-row">
                    <span className="text-xs text-foreground">
                    Trigger Type:
                  </span>
                  <StyledChip label={<TextWithTooltip text={stage.spec.triggerType} />} />
                </div>
              </div>
            </div>
          </StyledCardHeader>

          <StyledCardBody>
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
          </StyledCardBody>
        </div>
      </LoadingWrapper>
    </StyledCardWrapper>
  );
};
