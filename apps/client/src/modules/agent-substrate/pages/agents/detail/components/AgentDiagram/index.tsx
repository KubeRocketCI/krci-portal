import React from "react";
import { MoveDown, MoveRight } from "lucide-react";
import type {
  AgentActor,
  AgentDetail,
  CodebaseRef,
  EgressPolicyRead,
  MergeRequest,
  WorkerPoolRef,
} from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { Alert } from "@/core/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";
import type { RequestError } from "@/core/types/global";
import { cn } from "@/core/utils/classname";
import { ActorStateBadge, AgentCodebaseLink } from "../../../../../components/ActorCells";
import { KV, type KVRow } from "../../../../../components/KV";
import { issueLabel } from "../../../../../utils/issueLabel";
import { plural } from "../../../../../utils/plural";
import { AgentActorFields, NOT_ON_A_WORKER, WorkerPoolLink } from "../AgentActorCard";
import { EgressPolicyBody } from "../AgentEgressPolicyCard";
import { NO_EGRESS_POLICY_TEXT, unreadableReasonText } from "../AgentEgressPolicyCard/text";
import { agentHeaderFacts } from "../AgentHeader/facts";
import {
  BranchesText,
  CommitText,
  HISTORY_UNREACHABLE_TEXT,
  LatestRun,
  MergeRequestLink,
  NO_CODEBASE_TEXT,
  NO_MERGE_REQUEST_TEXT,
  ReviewRunIcons,
  type ReviewRunsRead,
} from "../AgentProducedCard";
import { mergeRequestText } from "../AgentProducedCard/mergeRequestText";
import { agentProfileRows } from "../AgentProfileCard/rows";

export const NO_REVIEW_RUN_TEXT = "No review run yet.";

/** DOM and keyboard order: the grid rows top to bottom, each row left to right. */
const BOX_IDS = ["issue", "agent", "actor", "mergeRequest", "egressPolicy", "reviewRuns"] as const;

type BoxId = (typeof BOX_IDS)[number];

interface Box {
  type: string;
  name: string;
  summary: React.ReactNode;
  /** The fields of the view Sections. */
  fields: React.ReactNode;
  cell: string;
}

/** Elements that handle their own click. Includes the select button of the box. */
const INTERACTIVE_SELECTOR = "a, button, input, select, textarea, summary, [role='button'], [tabindex]";

const INSPECTOR_ID = "agent-diagram-inspector";

interface Arrow {
  from: BoxId;
  to: BoxId;
  label: string;
  direction: "right" | "down";
  cell: string;
}

const ARROWS: Arrow[] = [
  { from: "issue", to: "agent", label: "works on", direction: "right", cell: "col-start-2 row-start-1" },
  { from: "agent", to: "actor", label: "runs in", direction: "right", cell: "col-start-4 row-start-1" },
  { from: "actor", to: "egressPolicy", label: "bounded by", direction: "down", cell: "col-start-5 row-start-2" },
  { from: "agent", to: "mergeRequest", label: "pushes", direction: "down", cell: "col-start-3 row-start-2" },
  { from: "mergeRequest", to: "reviewRuns", label: "reviewed by", direction: "down", cell: "col-start-3 row-start-4" },
];

const FIRST_SELECTED: BoxId = "actor";

export interface AgentDiagramProps {
  agent: AgentDetail;
  actor: AgentActor;
  egressPolicy: EgressPolicyRead;
  /** From the fleet read. Null while it is not ready or holds no row of the actor. */
  usableWorkerPools: WorkerPoolRef[] | null;
  reviewRuns: ReviewRunsRead;
}

function egressPolicyName(egressPolicy: EgressPolicyRead): string {
  switch (egressPolicy.state) {
    case "ready":
      return "default";
    case "none":
      return "None";
    case "unreadable":
      return "Not read";
  }
}

function egressPolicySummary(egressPolicy: EgressPolicyRead): string {
  switch (egressPolicy.state) {
    case "ready": {
      const { rules } = egressPolicy;
      const hosts = new Set(rules.flatMap((rule) => rule.hosts)).size;
      const unknown = rules.filter((rule) => rule.kind === "unknown").length;
      return [plural(rules.length, "rule"), plural(hosts, "host"), unknown > 0 && plural(unknown, "unknown rule")]
        .filter(Boolean)
        .join(" · ");
    }
    case "none":
      return NO_EGRESS_POLICY_TEXT;
    case "unreadable":
      return unreadableReasonText(egressPolicy.reason);
  }
}

/** The getAgentReviewRuns read as the Merge request and Review runs boxes show it. */
type Produced =
  | { kind: "noCodebase" }
  | { kind: "loading" }
  | { kind: "failed"; error: RequestError }
  | {
      kind: "read";
      codebase: CodebaseRef;
      mergeRequests: MergeRequest[];
      historyUnreachable: boolean;
      refreshError: RequestError | null;
    };

function producedOf(codebase: CodebaseRef | null, { mergeRequests, history, error }: ReviewRunsRead): Produced {
  if (!codebase) return { kind: "noCodebase" };
  if (mergeRequests) {
    return {
      kind: "read",
      codebase,
      mergeRequests,
      historyUnreachable: history === "unreachable",
      refreshError: error,
    };
  }
  return error ? { kind: "failed", error } : { kind: "loading" };
}

interface ProducedBoxContent {
  emptyText: string;
  /** Shows the notice of the Produced block when Tekton Results history is unreachable. */
  showsHistoryNotice: boolean;
  name: (mergeRequests: [MergeRequest, ...MergeRequest[]]) => string;
  summary: (newest: MergeRequest, codebase: CodebaseRef) => React.ReactNode;
  rowsOf: (mergeRequest: MergeRequest, codebase: CodebaseRef) => KVRow[];
}

function producedBox(produced: Produced, content: ProducedBoxContent): Pick<Box, "name" | "summary" | "fields"> {
  switch (produced.kind) {
    case "noCodebase":
      return { name: "None", summary: NO_CODEBASE_TEXT, fields: <EmptyList customText={NO_CODEBASE_TEXT} /> };
    case "loading":
      return {
        name: "Loading",
        summary: <Skeleton className="h-4 w-24" />,
        fields: (
          <div className="flex flex-col gap-2" aria-busy="true">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ),
      };
    case "failed":
      return {
        name: "Not read",
        summary: <ErrorContent error={produced.error} />,
        fields: <ErrorContent error={produced.error} outlined />,
      };
    case "read": {
      const { codebase, mergeRequests, historyUnreachable, refreshError } = produced;
      const newest = mergeRequests.at(0);
      return {
        name: newest ? content.name([newest, ...mergeRequests.slice(1)]) : "None yet",
        summary: refreshError ? (
          <ErrorContent error={refreshError} />
        ) : newest ? (
          content.summary(newest, codebase)
        ) : (
          content.emptyText
        ),
        fields: (
          <div className="flex flex-col gap-4">
            {refreshError && <ErrorContent error={refreshError} outlined />}
            {content.showsHistoryNotice && historyUnreachable && <Alert>{HISTORY_UNREACHABLE_TEXT}</Alert>}
            {newest ? (
              mergeRequests.map((mergeRequest) => (
                <KV key={mergeRequest.number} rows={content.rowsOf(mergeRequest, codebase)} />
              ))
            ) : (
              <EmptyList customText={content.emptyText} />
            )}
          </div>
        ),
      };
    }
  }
}

const mergeRequestRows = (mergeRequest: MergeRequest): KVRow[] => [
  ["Merge request", <MergeRequestLink mergeRequest={mergeRequest} />],
  ["Branches", <BranchesText mergeRequest={mergeRequest} />],
];

const reviewRunRows = (mergeRequest: MergeRequest, codebase: CodebaseRef): KVRow[] => [
  ["Merge request", mergeRequestText(mergeRequest)],
  ["Review runs", <ReviewRunIcons mergeRequest={mergeRequest} codebase={codebase} />],
  ["Latest run", mergeRequest.reviewRuns[0] && <LatestRun run={mergeRequest.reviewRuns[0]} />],
  ["Commit", mergeRequest.reviewRuns[0]?.commit && <CommitText mergeRequest={mergeRequest} />],
];

/** The newest number, then the count of the others: `!7 +3`. */
function mergeRequestsName([newest, ...others]: [MergeRequest, ...MergeRequest[]]): string {
  return others.length > 0 ? `${mergeRequestText(newest)} +${others.length}` : mergeRequestText(newest);
}

function boxesOf({ agent, actor, egressPolicy, usableWorkerPools, reviewRuns }: AgentDiagramProps): Record<BoxId, Box> {
  const facts = agentHeaderFacts({ agent, actor });
  const produced = producedOf(agent.codebase, reviewRuns);

  return {
    issue: {
      type: "Issue",
      name: issueLabel(agent.issue),
      summary: <AgentCodebaseLink agent={agent} />,
      fields: <KV rows={[facts.issue, facts.codebase]} />,
      cell: "col-start-1 row-start-1",
    },
    agent: {
      type: "Agent",
      name: [agent.agentProfile, agent.model].filter(Boolean).join(" · ") || "Agent",
      summary: agent.turnLimit === null ? "no turn limit" : `limit ${plural(agent.turnLimit, "turn")}`,
      fields: <KV rows={[facts.actorState, facts.turnLimit, facts.issueBranch, ...agentProfileRows(agent)]} />,
      cell: "col-start-3 row-start-1",
    },
    actor: {
      type: "Actor",
      name: actor.name,
      summary: (
        <>
          <ActorStateBadge state={actor.state} />
          {actor.placement ? (
            <WorkerPoolLink
              workerPool={{ namespace: actor.placement.workerNamespace, name: actor.placement.workerPool }}
            />
          ) : (
            NOT_ON_A_WORKER
          )}
        </>
      ),
      fields: <AgentActorFields actor={actor} usableWorkerPools={usableWorkerPools} />,
      cell: "col-start-5 row-start-1",
    },
    egressPolicy: {
      type: "Egress policy",
      name: egressPolicyName(egressPolicy),
      summary: egressPolicySummary(egressPolicy),
      fields: <EgressPolicyBody egressPolicy={egressPolicy} />,
      cell: "col-start-5 row-start-3",
    },
    mergeRequest: {
      type: "Merge request",
      ...producedBox(produced, {
        emptyText: NO_MERGE_REQUEST_TEXT,
        showsHistoryNotice: false,
        name: mergeRequestsName,
        summary: (newest) => <BranchesText mergeRequest={newest} />,
        rowsOf: mergeRequestRows,
      }),
      cell: "col-start-3 row-start-3",
    },
    reviewRuns: {
      type: "Review runs",
      ...producedBox(produced, {
        emptyText: NO_REVIEW_RUN_TEXT,
        showsHistoryNotice: true,
        name: (mergeRequests) =>
          plural(
            mergeRequests.reduce((count, mergeRequest) => count + mergeRequest.reviewRuns.length, 0),
            "review run"
          ),
        summary: (newest, codebase) => <ReviewRunIcons mergeRequest={newest} codebase={codebase} />,
        rowsOf: reviewRunRows,
      }),
      cell: "col-start-3 row-start-5",
    },
  };
}

interface DiagramBoxProps {
  box: Box;
  selected: boolean;
  onSelect: () => void;
}

function DiagramBox({ box, selected, onSelect }: DiagramBoxProps) {
  const selectRef = React.useRef<HTMLButtonElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // React bubbles a click in portaled content (dialog, tooltip) to the box; that is not a click on the box.
    if (!event.currentTarget.contains(event.target as Node)) return;
    const control = (event.target as Element).closest(INTERACTIVE_SELECTOR);
    if (control && control !== selectRef.current && event.currentTarget.contains(control)) return;
    onSelect();
  };

  return (
    <Card
      role="group"
      aria-label={box.type}
      onClick={handleClick}
      className={cn(
        "border-border hover:border-primary/50 flex min-w-0 cursor-pointer flex-col gap-1 border p-3 transition-colors",
        selected && "border-primary ring-primary/20 ring-2",
        box.cell
      )}
    >
      <button
        ref={selectRef}
        type="button"
        aria-pressed={selected}
        aria-controls={INSPECTOR_ID}
        className="focus-visible:ring-ring flex min-w-0 flex-col items-start gap-0.5 rounded-sm text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{box.type}</span>
        <span className="text-foreground text-sm font-semibold break-all">{box.name}</span>
      </button>
      <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs break-all [&>*]:min-w-0">
        {box.summary}
      </div>
    </Card>
  );
}

function DiagramArrow({ arrow, boxes }: { arrow: Arrow; boxes: Record<BoxId, Box> }) {
  const Icon = arrow.direction === "right" ? MoveRight : MoveDown;
  return (
    <div
      role="img"
      aria-label={`${boxes[arrow.from].type} ${arrow.label} ${boxes[arrow.to].type}`}
      className={cn(
        "text-muted-foreground flex items-center justify-center gap-1 text-xs",
        arrow.direction === "right" ? "flex-col" : "flex-row py-1",
        arrow.cell
      )}
    >
      {arrow.direction === "right" && <span>{arrow.label}</span>}
      <Icon className="size-5 shrink-0" aria-hidden />
      {arrow.direction === "down" && <span>{arrow.label}</span>}
    </div>
  );
}

export function AgentDiagram(props: AgentDiagramProps) {
  const [selectedId, setSelectedId] = React.useState<BoxId>(FIRST_SELECTED);
  const boxes = boxesOf(props);
  const selected = boxes[selectedId];

  return (
    <section
      aria-label="Diagram"
      className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
    >
      <Card className="overflow-x-auto p-4">
        <div className="grid min-w-[44rem] grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)_4.5rem_minmax(0,1fr)] grid-rows-[auto_auto_auto_auto_auto]">
          {BOX_IDS.map((id) => (
            <DiagramBox key={id} box={boxes[id]} selected={id === selectedId} onSelect={() => setSelectedId(id)} />
          ))}
          {ARROWS.map((arrow) => (
            <DiagramArrow key={`${arrow.from}-${arrow.to}`} arrow={arrow} boxes={boxes} />
          ))}
        </div>
      </Card>
      <Card id={INSPECTOR_ID} role="region" aria-label="Inspector">
        <CardHeader className="p-4 pb-2">
          <CardTitle aria-live="polite" className="text-sm font-semibold">
            {selected.type}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">{selected.fields}</CardContent>
      </Card>
    </section>
  );
}
