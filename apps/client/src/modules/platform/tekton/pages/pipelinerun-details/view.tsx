import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { ResourceIconLink } from "@/core/components/ResourceIconLink";
import { Section } from "@/core/components/Section";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { humanize } from "@/core/utils/date-humanize";
import { useCodebaseBranchWatchItem } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { getPipelineRunStatusIcon } from "@/k8s/api/groups/Tekton/PipelineRun/utils";
import { getPipelineRunStatus, getPullRequestURL, pipelineRunLabels } from "@my-project/shared";
import { Activity, Calendar, Clock, GitBranch, SquareArrowOutUpRight, Timer } from "lucide-react";
import React from "react";
import { PipelineRunActionsMenu } from "../../components/PipelineRunActionsMenu";
import { PATH_PIPELINERUNS_FULL } from "../pipelinerun-list/route";
import { ReserveLogs } from "./components/ReserveLogs";
import { usePipelineRunWatchWithPageParams } from "./hooks/data";
import { useTabs } from "./hooks/useTabs";
import { routePipelineRunDetails } from "./route";

const HeaderMetadata = () => {
  const params = routePipelineRunDetails.useParams();
  const pipelineRunWatch = usePipelineRunWatchWithPageParams();
  const pipelineRun = pipelineRunWatch.query.data;

  const codebaseBranchMetadataName = pipelineRun?.metadata?.labels?.[pipelineRunLabels.codebaseBranch];

  const codebaseBranchWatch = useCodebaseBranchWatchItem({
    name: codebaseBranchMetadataName || "",
    namespace: params.namespace,
    queryOptions: {
      enabled: !!codebaseBranchMetadataName,
    },
  });

  if (!pipelineRunWatch.isReady || !pipelineRun) {
    return null;
  }

  const pipelineRunStatus = getPipelineRunStatus(pipelineRun);
  const pipelineRunStatusIcon = getPipelineRunStatusIcon(pipelineRun);

  const codebaseBranchName = codebaseBranchWatch.query.data?.spec?.branchName;
  const codebase = pipelineRun.metadata?.labels?.[pipelineRunLabels.codebase];
  const pipelineName = pipelineRun.metadata?.labels?.[pipelineRunLabels.pipeline];

  const startedAt = pipelineRunStatus.startTime
    ? new Date(pipelineRunStatus.startTime).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
    : null;

  const activeDuration = pipelineRunStatus.startTime
    ? humanize(
        pipelineRunStatus.completionTime
          ? new Date(pipelineRunStatus.completionTime).getTime() - new Date(pipelineRunStatus.startTime).getTime()
          : new Date().getTime() - new Date(pipelineRunStatus.startTime).getTime(),
        {
          language: "en-mini",
          spacer: "",
          delimiter: " ",
          fallbacks: ["en"],
          largest: 2,
          round: true,
          units: ["d", "h", "m", "s"],
        }
      )
    : null;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <div className="flex items-center gap-2">
        <Clock className="text-muted-foreground size-4" />
        <span className="text-muted-foreground text-sm">Status:</span>
        <div className="flex items-center gap-1.5">
          <StatusIcon
            Icon={pipelineRunStatusIcon.component}
            isSpinning={pipelineRunStatusIcon.isSpinning}
            color={pipelineRunStatusIcon.color}
            width={14}
          />
          <span className="text-foreground text-sm font-medium">{pipelineRunStatus.reason}</span>
        </div>
      </div>

      {pipelineName && (
        <div className="flex items-center gap-2">
          <Activity className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm">Pipeline:</span>
          <span className="text-foreground text-sm font-medium">{pipelineName}</span>
        </div>
      )}

      {(codebase || codebaseBranchName) && (
        <div className="flex items-center gap-2">
          <GitBranch className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm">Branch:</span>
          <span className="text-foreground text-sm font-medium">
            {codebase && codebaseBranchName ? `${codebase}/${codebaseBranchName}` : codebaseBranchName || codebase}
          </span>
        </div>
      )}

      {startedAt && (
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm">Started:</span>
          <span className="text-foreground text-sm font-medium">{startedAt}</span>
        </div>
      )}

      {activeDuration && (
        <div className="flex items-center gap-2">
          <Timer className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm">Duration:</span>
          <span className="text-foreground text-sm font-medium">{activeDuration}</span>
        </div>
      )}
    </div>
  );
};

const HeaderActions = () => {
  const params = routePipelineRunDetails.useParams();
  const pipelineRunWatch = usePipelineRunWatchWithPageParams();
  const pipelineRun = pipelineRunWatch.query.data;

  if (!pipelineRunWatch.isReady || !pipelineRun) {
    return null;
  }

  return (
    <PipelineRunActionsMenu
      data={{
        pipelineRun: pipelineRun,
      }}
      backRoute={{
        to: PATH_PIPELINERUNS_FULL,
        params: {
          clusterName: params.clusterName,
        },
      }}
      variant="inline"
    />
  );
};

export default function PipelineRunDetailsPageContent() {
  const params = routePipelineRunDetails.useParams();
  const pipelineRunWatch = usePipelineRunWatchWithPageParams();
  const pipelineRun = pipelineRunWatch.query.data;

  const tabs = useTabs();
  const { activeTab, handleChangeTab } = useTabsContext();

  const renderPageContent = React.useCallback(() => {
    if (pipelineRunWatch.query.isError) {
      return <ReserveLogs />;
    }

    return (
      <LoadingWrapper isLoading={pipelineRunWatch.query.isLoading}>
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </LoadingWrapper>
    );
  }, [pipelineRunWatch.query.isError, pipelineRunWatch.query.isLoading, tabs, activeTab, handleChangeTab]);

  const renderHeaderSlot = (): React.ReactElement | undefined => {
    if (!pipelineRunWatch.isReady || !pipelineRun) {
      return undefined;
    }

    const pullRequestLink = getPullRequestURL(pipelineRun);

    if (!pullRequestLink) {
      return undefined;
    }

    return (
      <ResourceIconLink
        tooltipTitle={"Go to the Pull Request page"}
        link={pullRequestLink}
        Icon={<SquareArrowOutUpRight />}
        name="pull request"
        isTextButton
        variant="outline"
        size="sm"
      />
    );
  };

  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "PipelineRuns",
          route: {
            to: PATH_PIPELINERUNS_FULL,
          },
        },
        {
          label: params.name,
        },
      ]}
      headerSlot={renderHeaderSlot()}
    >
      <Section
        icon={Activity}
        title={params.name}
        enableCopyTitle
        actions={<HeaderActions />}
        extraContent={<HeaderMetadata />}
      >
        {renderPageContent()}
      </Section>
    </PageWrapper>
  );
}
