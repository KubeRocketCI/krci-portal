import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Badge } from "@/core/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { Button } from "@/core/components/ui/button";
import { useTabsContext } from "@/core/providers/Tabs/hooks";
import { formatDuration, formatTimestamp } from "@/core/utils/date-humanize";
import { useCodebaseBranchWatchItem } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { getPipelineRunStatusIcon } from "@/k8s/api/groups/Tekton/PipelineRun/utils";
import {
  getPipelineRunStatus,
  PipelineRun,
  pipelineRunLabels,
  tektonResultAnnotations,
  getPipelineRunAnnotation,
} from "@my-project/shared";
import { Calendar, Clock, EllipsisVertical, GitBranch, GitPullRequest, SearchX, Timer, User } from "lucide-react";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import React from "react";
import { PipelineRunActionsMenu } from "../../components/PipelineRunActionsMenu";
import { PATH_PIPELINERUNS_FULL } from "../pipelinerun-list/route";
import { useTabs } from "./hooks/useTabs";
import { routePipelineRunDetails } from "./route";
import { Link } from "@tanstack/react-router";
import { PATH_PIPELINE_DETAILS_FULL } from "../pipeline-details/route";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { AuthorAvatar } from "@/core/components/AuthorAvatar";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { PipelineRunProvider } from "./providers/PipelineRun/provider";
import { usePipelineRunContext } from "./providers/PipelineRun/hooks";

/**
 * Look up an annotation from resultAnnotations JSON first, then fall back to raw metadata annotations.
 * This handles both history data (where annotations are in resultAnnotations JSON)
 * and live data (where annotations are on the CR metadata directly).
 */
function getAnnotation(pr: PipelineRun, key: string): string | undefined {
  return getPipelineRunAnnotation(pr, key) ?? pr.metadata?.annotations?.[key];
}

function HeaderMetadata() {
  const params = routePipelineRunDetails.useParams();
  const unifiedData = usePipelineRunContext();
  const pipelineRun = unifiedData.pipelineRun;
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
      enabled: !!codebaseBranchMetadataName && unifiedData.source === "live",
    },
  });

  if (!unifiedData.isReady || !pipelineRun) {
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

  const startedAt = pipelineRunStatus.startTime ? formatTimestamp(pipelineRunStatus.startTime) : null;

  const activeDuration = pipelineRunStatus.startTime
    ? formatDuration(pipelineRunStatus.startTime, pipelineRunStatus.completionTime || undefined)
    : null;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <div className="flex items-center gap-2">
        <Clock className="text-muted-foreground size-4" />
        <span className="text-muted-foreground text-sm">Status:</span>
        <Badge
          className="h-6"
          style={{ backgroundColor: `${pipelineRunStatusIcon.color}15`, color: pipelineRunStatusIcon.color }}
        >
          <StatusIcon
            Icon={pipelineRunStatusIcon.component}
            isSpinning={pipelineRunStatusIcon.isSpinning}
            color={pipelineRunStatusIcon.color}
            width={12}
          />
          <span className="capitalize">{pipelineRunStatus.reason}</span>
        </Badge>
      </div>

      {unifiedData.source === "history" && (
        <Badge variant="outline" className="text-muted-foreground">
          Historical Data
        </Badge>
      )}

      {pipelineName && (
        <div className="flex items-center gap-2">
          <ENTITY_ICON.pipeline className="text-muted-foreground size-4" />
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
          <ENTITY_ICON.project className="text-muted-foreground size-4" />
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
        const changeNumber = getAnnotation(pipelineRun, tektonResultAnnotations.gitChangeNumber);
        const changeUrl = getAnnotation(pipelineRun, tektonResultAnnotations.gitChangeUrl);

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
        const gitAuthor = getAnnotation(pipelineRun, tektonResultAnnotations.gitAuthor);
        const gitAvatar = getAnnotation(pipelineRun, tektonResultAnnotations.gitAvatar);

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
}

function HeaderActions() {
  const params = routePipelineRunDetails.useParams();
  const unifiedData = usePipelineRunContext();
  const pipelineRun = unifiedData.pipelineRun;
  const [menuOpen, setMenuOpen] = React.useState(false);

  if (!unifiedData.isReady || !pipelineRun) {
    return null;
  }

  // For history data, show a badge instead of actions (K8s operations are unavailable)
  if (unifiedData.source === "history") {
    return null;
  }

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="More options">
          Actions
          <EllipsisVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
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
        variant="menu"
      />
    </DropdownMenu>
  );
}

export default function PipelineRunDetailsPageContent({ searchTabIdx }: { searchTabIdx: number }) {
  return (
    <PipelineRunProvider>
      <PipelineRunDetailsPageInner searchTabIdx={searchTabIdx} />
    </PipelineRunProvider>
  );
}

function PipelineRunDetailsPageInner({ searchTabIdx }: { searchTabIdx: number }) {
  const params = routePipelineRunDetails.useParams();
  const unifiedData = usePipelineRunContext();

  const tabs = useTabs();
  const { handleChangeTab } = useTabsContext();

  const showTabs = unifiedData.isReady && !unifiedData.error;
  const showNotFound = !!unifiedData.error && !unifiedData.isLoading;

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
      <PageContentWrapper
        icon={ENTITY_ICON.pipelineRun}
        title={params.name}
        enableCopyTitle
        actions={<HeaderActions />}
        subHeader={<HeaderMetadata />}
        tabs={showTabs ? tabs : undefined}
        activeTab={searchTabIdx}
        onTabChange={handleChangeTab}
      >
        {showNotFound && (
          <div className="flex items-center justify-center gap-2 py-8">
            <SearchX className="text-muted-foreground" size={48} />
            <span className="text-muted-foreground text-sm">
              Sorry. The requested PipelineRun was not found in the cluster or in Tekton Results history.
            </span>
          </div>
        )}
        {unifiedData.isLoading && <LoadingWrapper isLoading>{null}</LoadingWrapper>}
      </PageContentWrapper>
    </PageWrapper>
  );
}
