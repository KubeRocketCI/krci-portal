import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { formatTimestamp, formatDuration } from "@/core/utils/date-humanize";
import { pipelineRunLabels } from "@my-project/shared";
import { Activity, Calendar, Clock, GitBranch, Timer } from "lucide-react";
import React from "react";
import { PATH_PIPELINERUNS_FULL } from "../pipelinerun-list/route";
import { useTektonResultPipelineRunQuery } from "./hooks/data";
import { useTabs } from "./hooks/useTabs";
import { routeTektonResultPipelineRunDetails } from "./route";
import { getPipelineRunConditionStatusIcon } from "../../utils/statusIcons";
import { Badge } from "@/core/components/ui/badge";

const HeaderMetadata = () => {
  const pipelineRunQuery = useTektonResultPipelineRunQuery();
  const pipelineRun = pipelineRunQuery.data?.pipelineRun;

  if (pipelineRunQuery.isLoading || !pipelineRun) {
    return null;
  }

  const condition = pipelineRun.status?.conditions?.[0];
  const statusConfig = getPipelineRunConditionStatusIcon(condition);

  const pipelineName =
    pipelineRun.metadata?.labels?.[pipelineRunLabels.pipeline] || pipelineRun.spec?.pipelineRef?.name;

  const codebase = pipelineRun.metadata?.labels?.[pipelineRunLabels.codebase];
  const codebaseBranch = pipelineRun.metadata?.labels?.[pipelineRunLabels.codebaseBranch];

  const startTime = pipelineRun.status?.startTime;
  const completionTime = pipelineRun.status?.completionTime;

  const startedAt = startTime ? formatTimestamp(startTime) : null;
  const activeDuration = startTime ? formatDuration(startTime, completionTime) : null;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <div className="flex items-center gap-2">
        <Clock className="text-muted-foreground size-4" />
        <span className="text-muted-foreground text-sm">Status:</span>
        <div className="flex items-center gap-1.5">
          <StatusIcon
            Icon={statusConfig.Icon}
            isSpinning={statusConfig.isSpinning}
            color={statusConfig.color}
            width={14}
          />
          <span className="text-foreground text-sm font-medium">{condition?.reason || "Unknown"}</span>
        </div>
      </div>

      {pipelineName && (
        <div className="flex items-center gap-2">
          <Activity className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm">Pipeline:</span>
          <span className="text-foreground text-sm font-medium">{pipelineName}</span>
        </div>
      )}

      {(codebase || codebaseBranch) && (
        <div className="flex items-center gap-2">
          <GitBranch className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm">Branch:</span>
          <span className="text-foreground text-sm font-medium">
            {codebase && codebaseBranch ? `${codebase}/${codebaseBranch}` : codebaseBranch || codebase}
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
  // For now, no actions - could add "View Live" link if the PipelineRun still exists in cluster
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Historical Data
    </Badge>
  );
};

export default function TektonResultPipelineRunDetailsPageContent() {
  const params = routeTektonResultPipelineRunDetails.useParams();
  const pipelineRunQuery = useTektonResultPipelineRunQuery();
  const pipelineRun = pipelineRunQuery.data?.pipelineRun;

  const tabs = useTabs();
  const { activeTab, handleChangeTab } = useTabsContext();

  // Get display name - prefer the actual PipelineRun name from metadata
  const displayName = pipelineRun?.metadata?.name || params.recordUid;

  const renderPageContent = React.useCallback(() => {
    if (pipelineRunQuery.isError) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive text-lg font-medium">Failed to load PipelineRun</p>
          <p className="text-muted-foreground mt-2 text-sm">
            {pipelineRunQuery.error instanceof Error ? pipelineRunQuery.error.message : "Unknown error"}
          </p>
        </div>
      );
    }

    return (
      <LoadingWrapper isLoading={pipelineRunQuery.isLoading}>
        <Tabs tabs={tabs} activeTabIdx={activeTab} handleChangeTab={handleChangeTab} />
      </LoadingWrapper>
    );
  }, [pipelineRunQuery.isError, pipelineRunQuery.isLoading, pipelineRunQuery.error, tabs, activeTab, handleChangeTab]);

  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "PipelineRuns",
          route: {
            to: PATH_PIPELINERUNS_FULL,
            params: { clusterName: params.clusterName },
            search: { tab: "tekton-results" },
          },
        },
        {
          label: displayName,
        },
      ]}
    >
      <Section
        icon={Activity}
        title={displayName}
        enableCopyTitle
        actions={<HeaderActions />}
        extraContent={<HeaderMetadata />}
      >
        {renderPageContent()}
      </Section>
    </PageWrapper>
  );
}
