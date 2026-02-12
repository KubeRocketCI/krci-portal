import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { humanize } from "@/core/utils/date-humanize";
import { useCodebaseBranchWatchItem } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { getPipelineRunStatusIcon } from "@/k8s/api/groups/Tekton/PipelineRun/utils";
import {
  getPipelineRunStatus,
  pipelineRunLabels,
  tektonResultAnnotations,
  getPipelineRunAnnotation,
} from "@my-project/shared";
import { Activity, Calendar, Clock, GitBranch, GitPullRequest, SearchX, Timer, User, Code } from "lucide-react";
import React from "react";
import { PipelineRunActionsMenu } from "../../components/PipelineRunActionsMenu";
import { PATH_PIPELINERUNS_FULL } from "../pipelinerun-list/route";
import { usePipelineRunWatchWithPageParams } from "./hooks/data";
import { usePipelineRunFallbackRedirect } from "./hooks/usePipelineRunFallbackRedirect";
import { useTabs } from "./hooks/useTabs";
import { routePipelineRunDetails } from "./route";
import { Link } from "@tanstack/react-router";
import { PATH_PIPELINE_DETAILS_FULL } from "../pipeline-details/route";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { AuthorAvatar } from "@/core/components/AuthorAvatar";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

const HeaderMetadata = () => {
  const params = routePipelineRunDetails.useParams();
  const pipelineRunWatch = usePipelineRunWatchWithPageParams();
  const pipelineRun = pipelineRunWatch.query.data;
  const { namespace: defaultNamespace, clusterName } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
      clusterName: state.clusterName,
    }))
  );

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

  // Get codebase from annotations first, then fallback to labels
  const codebaseFromAnnotation = getPipelineRunAnnotation(pipelineRun, tektonResultAnnotations.codebase);
  const codebase = codebaseFromAnnotation || pipelineRun.metadata?.labels?.[pipelineRunLabels.codebase];

  // Get branch name from annotations first, then fallback to codebaseBranch spec
  const gitBranch = getPipelineRunAnnotation(pipelineRun, tektonResultAnnotations.gitBranch);
  const branchName = gitBranch || codebaseBranchWatch.query.data?.spec?.branchName;

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
          <span className="text-foreground text-sm">{pipelineRunStatus.reason}</span>
        </div>
      </div>

      {pipelineName && (
        <div className="flex items-center gap-2">
          <Activity className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm">Pipeline:</span>
          <Link
            to={PATH_PIPELINE_DETAILS_FULL}
            params={{
              clusterName,
              namespace: pipelineRun.metadata.namespace || defaultNamespace,
              name: pipelineName,
            }}
            className="text-sm font-medium hover:underline"
          >
            {pipelineName}
          </Link>
        </div>
      )}

      {codebase && (
        <div className="flex items-center gap-2">
          <Code className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm">Codebase:</span>
          <Link
            to={PATH_PROJECT_DETAILS_FULL}
            params={{
              clusterName,
              namespace: pipelineRun.metadata.namespace || defaultNamespace,
              name: codebase,
            }}
            className="text-sm font-medium hover:underline"
          >
            {codebase}
          </Link>
        </div>
      )}

      {branchName && (
        <div className="flex items-center gap-2">
          <GitBranch className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm">Branch:</span>
          <span className="text-foreground text-sm">{branchName}</span>
        </div>
      )}

      {(() => {
        const changeNumber =
          getPipelineRunAnnotation(pipelineRun, tektonResultAnnotations.gitChangeNumber) ??
          pipelineRun.metadata?.annotations?.[tektonResultAnnotations.gitChangeNumber];
        const changeUrl =
          getPipelineRunAnnotation(pipelineRun, tektonResultAnnotations.gitChangeUrl) ??
          pipelineRun.metadata?.annotations?.[tektonResultAnnotations.gitChangeUrl];

        if (!changeNumber) {
          return null;
        }

        return (
          <div className="flex items-center gap-2">
            <GitPullRequest className="text-muted-foreground size-4" />
            <span className="text-muted-foreground text-sm">PR:</span>
            {changeUrl ? (
              <a
                href={changeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
              >
                #{changeNumber}
              </a>
            ) : (
              <span className="text-foreground text-sm">#{changeNumber}</span>
            )}
          </div>
        );
      })()}

      {(() => {
        const gitAuthor = getPipelineRunAnnotation(pipelineRun, tektonResultAnnotations.gitAuthor);
        const gitAvatar = getPipelineRunAnnotation(pipelineRun, tektonResultAnnotations.gitAvatar);

        if (!gitAuthor) {
          return null;
        }

        return (
          <div className="flex items-center gap-2">
            <User className="text-muted-foreground size-4" />
            <span className="text-muted-foreground text-sm">Author:</span>
            <AuthorAvatar author={gitAuthor} avatarUrl={gitAvatar} size="sm" />
          </div>
        );
      })()}

      {startedAt && (
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm">Started:</span>
          <span className="text-foreground text-sm">{startedAt}</span>
        </div>
      )}

      {activeDuration && (
        <div className="flex items-center gap-2">
          <Timer className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm">Duration:</span>
          <span className="text-foreground text-sm">{activeDuration}</span>
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

export default function PipelineRunDetailsPageContent({ searchTabIdx }: { searchTabIdx: number }) {
  const params = routePipelineRunDetails.useParams();
  const pipelineRunWatch = usePipelineRunWatchWithPageParams();

  const tabs = useTabs();
  const { handleChangeTab } = useTabsContext();

  // When the live PipelineRun is not found (404), attempt to redirect to Tekton Results history
  const { isRedirecting, notFoundAnywhere } = usePipelineRunFallbackRedirect(
    pipelineRunWatch.query.error,
    pipelineRunWatch.query.isLoading
  );

  const renderPageContent = React.useCallback(() => {
    if (isRedirecting) {
      return <LoadingWrapper isLoading>{null}</LoadingWrapper>;
    }

    if (notFoundAnywhere) {
      return (
        <div className="flex items-center justify-center gap-2 py-8">
          <SearchX className="text-muted-foreground" size={48} />
          <span className="text-muted-foreground text-sm">
            Sorry. The requested PipelineRun was not found in the cluster or in Tekton Results history.
          </span>
        </div>
      );
    }

    return (
      <LoadingWrapper isLoading={pipelineRunWatch.query.isLoading}>
        <Tabs tabs={tabs} activeTabIdx={searchTabIdx} handleChangeTab={handleChangeTab} />
      </LoadingWrapper>
    );
  }, [pipelineRunWatch.query.isLoading, isRedirecting, notFoundAnywhere, tabs, searchTabIdx, handleChangeTab]);

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
