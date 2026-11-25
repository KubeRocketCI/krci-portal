import { useShallow } from "zustand/react/shallow";
import {
  pipelineRunPhase,
  pipelineType,
  type CodebaseRef,
  type MergeRequest,
  type ReviewRun,
  type ReviewRunHistory,
} from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { StatusIcon } from "@/core/components/StatusIcon";
import { DataTable } from "@/core/components/Table";
import { CellExternalLink, CellLink } from "@/core/components/Table/components/CellLink";
import type { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Alert } from "@/core/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tooltip } from "@/core/components/ui/tooltip";
import type { RequestError } from "@/core/types/global";
import { formatDuration, formatTimestamp, humanize, HUMANIZE_DURATION_OPTIONS } from "@/core/utils/date-humanize";
import { getPipelineRunStatusDisplay } from "@/k8s/api/groups/Tekton/PipelineRun/utils";
import { TABLE } from "@/k8s/constants/tables";
import { useClusterStore } from "@/k8s/store";
import { PATH_PIPELINERUN_DETAILS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { PATH_PIPELINERUNS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-list/route";
import { mergeRequestText } from "./mergeRequestText";

const TITLE_ID = "agent-produced-title";

export const REVIEW_RUN_ICON_COUNT = 5;

export const NO_MERGE_REQUEST_TEXT = "No merge request with a review run yet.";

const EMPTY_LIST = <EmptyList customText={NO_MERGE_REQUEST_TEXT} />;

export const NO_CODEBASE_TEXT = "No Codebase matches the project of the agent, or you may not read it.";

export const HISTORY_UNREACHABLE_TEXT =
  "Review run history is not available. The block shows only the review runs that are on the cluster.";

const SHORT_COMMIT_LENGTH = 7;

function statusDisplayOf({ status }: ReviewRun) {
  return getPipelineRunStatusDisplay({ phase: status.phase, reason: status.reason });
}

function durationOf(run: ReviewRun): string | null {
  if (run.durationMs !== null) return humanize(run.durationMs, HUMANIZE_DURATION_OPTIONS);
  return run.startedAt && run.status.phase === pipelineRunPhase["in-progress"] ? formatDuration(run.startedAt) : null;
}

function ReviewRunIcon({ run, clusterName }: { run: ReviewRun; clusterName: string }) {
  const display = statusDisplayOf(run);
  const duration = durationOf(run);
  const title = [run.name, display.label, duration].filter(Boolean).join(" · ");

  return (
    <Tooltip title={title} delayDuration={300}>
      <CellLink
        to={PATH_PIPELINERUN_DETAILS_FULL}
        params={{ clusterName, namespace: run.namespace, name: run.name }}
        text={null}
        iconOnly
        icon={<StatusIcon Icon={display.component} color={display.color} isSpinning={display.isSpinning} width={16} />}
        aria-label={title}
        className="h-auto w-auto"
      />
    </Tooltip>
  );
}

export function ReviewRunIcons({ mergeRequest, codebase }: { mergeRequest: MergeRequest; codebase: CodebaseRef }) {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const newestFirst = mergeRequest.reviewRuns.slice(0, REVIEW_RUN_ICON_COUNT);
  const more = mergeRequest.reviewRuns.length - newestFirst.length;

  return (
    <div className="flex items-center gap-1">
      {[...newestFirst].reverse().map((run, index) => (
        // History can hold two runs with one name.
        <ReviewRunIcon key={`${run.name}-${index}`} run={run} clusterName={clusterName} />
      ))}
      {more > 0 && (
        <CellLink
          to={PATH_PIPELINERUNS_FULL}
          params={{ clusterName }}
          search={{ codebases: [codebase.name], pipelineType: pipelineType.review }}
          text={`+${more}`}
          aria-label={`+${more}: review runs of ${codebase.name}`}
          className="w-auto"
        />
      )}
    </div>
  );
}

export function LatestRun({ run }: { run: ReviewRun }) {
  const display = statusDisplayOf(run);
  const facts = [run.startedAt && formatTimestamp(run.startedAt), durationOf(run)].filter(Boolean).join(" · ");

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm">
      <StatusIcon Icon={display.component} color={display.color} isSpinning={display.isSpinning} width={14} />
      <TextWithTooltip text={display.label} className="shrink-0" />
      {facts && <TextWithTooltip text={facts} className="text-muted-foreground min-w-0" />}
    </div>
  );
}

export function MergeRequestLink({ mergeRequest }: { mergeRequest: MergeRequest }) {
  return mergeRequest.url ? (
    <CellExternalLink href={mergeRequest.url} text={mergeRequestText(mergeRequest)} />
  ) : (
    mergeRequestText(mergeRequest)
  );
}

export function BranchesText({ mergeRequest: { sourceBranch, targetBranch } }: { mergeRequest: MergeRequest }) {
  return (
    <span className="font-mono text-xs">
      <TextWithTooltip text={targetBranch ? `${sourceBranch} → ${targetBranch}` : sourceBranch} />
    </span>
  );
}

export function CommitText({ mergeRequest }: { mergeRequest: MergeRequest }) {
  const commit = mergeRequest.reviewRuns[0]?.commit;
  return commit ? (
    <Tooltip title={commit} delayDuration={300}>
      <span className="font-mono text-xs">{commit.slice(0, SHORT_COMMIT_LENGTH)}</span>
    </Tooltip>
  ) : null;
}

function columnsOf(codebase: CodebaseRef): TableColumn<MergeRequest>[] {
  return [
    {
      id: "mergeRequest",
      label: "Merge request",
      data: { render: ({ data }) => <MergeRequestLink mergeRequest={data} /> },
      cell: { baseWidth: 10 },
    },
    {
      id: "branches",
      label: "Branches",
      data: { render: ({ data }) => <BranchesText mergeRequest={data} /> },
      cell: { baseWidth: 20 },
    },
    {
      id: "reviewRuns",
      label: "Review runs",
      data: { render: ({ data }) => <ReviewRunIcons mergeRequest={data} codebase={codebase} /> },
      cell: { baseWidth: 15 },
    },
    {
      id: "latest",
      label: "Latest run",
      data: { render: ({ data }) => data.reviewRuns[0] && <LatestRun run={data.reviewRuns[0]} /> },
      cell: { baseWidth: 30 },
    },
    {
      id: "commit",
      label: "Commit",
      data: { render: ({ data }) => <CommitText mergeRequest={data} /> },
      cell: { baseWidth: 10 },
    },
  ];
}

export interface ReviewRunsRead {
  /** Undefined until a read succeeds. */
  mergeRequests: MergeRequest[] | undefined;
  /** Undefined until a read succeeds. */
  history: ReviewRunHistory | undefined;
  isLoading: boolean;
  error: RequestError | null;
}

export interface AgentProducedBlockProps extends ReviewRunsRead {
  /** Null: the agent has no Codebase. */
  codebase: CodebaseRef | null;
}

export function AgentProducedBlock({ codebase, mergeRequests, history, isLoading, error }: AgentProducedBlockProps) {
  return (
    <Card role="region" aria-labelledby={TITLE_ID}>
      <CardHeader className="p-4 pb-2">
        <CardTitle id={TITLE_ID} className="text-sm font-semibold">
          Produced
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {!codebase ? (
          <EmptyList customText={NO_CODEBASE_TEXT} />
        ) : (
          <div className="flex flex-col gap-2">
            {error && <ErrorContent error={error} outlined />}
            {history === "unreachable" && <Alert>{HISTORY_UNREACHABLE_TEXT}</Alert>}
            {(!error || mergeRequests) && (
              <DataTable<MergeRequest>
                id={TABLE.AGENT_MERGE_REQUEST_LIST.id}
                name={TABLE.AGENT_MERGE_REQUEST_LIST.name}
                data={mergeRequests ?? []}
                columns={columnsOf(codebase)}
                isLoading={isLoading}
                emptyListComponent={EMPTY_LIST}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
