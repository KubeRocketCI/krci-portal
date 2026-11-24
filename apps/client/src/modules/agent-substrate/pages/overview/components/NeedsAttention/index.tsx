import React from "react";
import { Link } from "@tanstack/react-router";
import { CircleAlert, CircleCheck } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { actorStateGroupSchema, type AttentionItem, type AttentionKind, type ReadyFleet } from "@my-project/shared";
import { SectionHeading } from "@/core/components/SectionHeading";
import { CellLink } from "@/core/components/Table/components/CellLink";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";
import { formatRelativeTime, formatUnixTimestamp } from "@/core/utils/date-humanize";
import { useClusterStore } from "@/k8s/store";
import { ActorLink, AgentIssueLink } from "../../../../components/ActorCells";
import { EmptyValue } from "../../../../components/EmptyValue";
import { WorkerStateBadge } from "../../../../components/WorkerCells";
import { ACTOR_FILTER_NAMES } from "../../../../constants/actorFilter";
import {
  PATH_AGENT_ACTOR_DETAIL_FULL,
  PATH_AGENT_ACTORS_FULL,
  PATH_AGENT_WORKER_POOLS_FULL,
} from "../../../../constants/paths";
import { workerAnchor, workerPoolAnchor } from "../../../../utils/rowAnchor";
import { WORKERS_SEARCH } from "../../../worker-pools/constants";
import {
  allClearText,
  checkedText,
  groupAttentionItems,
  groupTitle,
  NEEDS_ATTENTION_MAX_ROWS,
  notCheckedText,
  workerPoolCheckOf,
  type AttentionGroup,
} from "../../utils/needsAttention";

type ItemOf<K extends AttentionItem["kind"]> = Extract<AttentionItem, { kind: K }>;

function useClusterName() {
  return useClusterStore(useShallow((state) => state.clusterName));
}

const FOCUS_RING = "focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none";

function RelativeTime({ at, label }: { at: string | null; label: string }) {
  if (!at) return <EmptyValue />;
  return (
    <Tooltip title={`${label} ${formatUnixTimestamp(at)}`}>
      <time dateTime={at} tabIndex={0} className={cn("text-muted-foreground shrink-0", FOCUS_RING)}>
        {formatRelativeTime(at)}
      </time>
    </Tooltip>
  );
}

interface RowProps {
  severity: AttentionItem["severity"];
  name: React.ReactNode;
  aside: React.ReactNode;
  children?: React.ReactNode;
}

function Row({ severity, name, aside, children }: RowProps) {
  return (
    <li className="flex items-start gap-2 text-xs">
      <span
        className={cn(
          "mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full",
          severity === "error" ? "bg-status-error" : "bg-status-missing"
        )}
        aria-hidden
      />
      <span className="sr-only">{severity === "error" ? "Error" : "Warning"}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 font-mono">{name}</div>
          {aside}
        </div>
        {children && <div className="text-muted-foreground flex min-w-0 flex-col gap-0.5">{children}</div>}
      </div>
    </li>
  );
}

function ActorCrashedRow({ item }: { item: ItemOf<"actorCrashed"> }) {
  return (
    <Row
      severity={item.severity}
      name={<ActorLink actor={item} />}
      aside={<RelativeTime at={item.crashedAt} label="Crashed" />}
    >
      {item.message && (
        <Tooltip title={item.message}>
          <span tabIndex={0} className={cn("line-clamp-2 block", FOCUS_RING)}>
            {item.message}
          </span>
        </Tooltip>
      )}
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0">Issue</span>
        <div className="min-w-0 flex-1">
          <AgentIssueLink agent={item.agent} />
        </div>
        <span className="shrink-0">Agent profile</span>
        <span className="text-foreground shrink-0">{item.agent?.agentProfile ?? <EmptyValue />}</span>
      </div>
    </Row>
  );
}

function WorkerPoolNotReadyRow({ item }: { item: ItemOf<"workerPoolNotReady"> }) {
  const clusterName = useClusterName();
  return (
    <Row
      severity={item.severity}
      name={
        <CellLink
          to={PATH_AGENT_WORKER_POOLS_FULL}
          params={{ clusterName }}
          hash={workerPoolAnchor(item)}
          text={item.name}
        />
      }
      aside={
        <span className="text-foreground shrink-0">
          {item.readyReplicas}/{item.desiredReplicas} ready
        </span>
      }
    >
      <TextWithTooltip text={item.namespace} className="text-xs" />
    </Row>
  );
}

function WorkerNotActiveRow({ item }: { item: ItemOf<"workerNotActive"> }) {
  const clusterName = useClusterName();
  return (
    <Row
      severity={item.severity}
      name={
        <CellLink
          to={PATH_AGENT_WORKER_POOLS_FULL}
          params={{ clusterName }}
          hash={workerAnchor(item)}
          text={item.name}
        />
      }
      aside={<WorkerStateBadge state={item.state} />}
    >
      <TextWithTooltip text={`Worker pool ${item.workerNamespace}/${item.workerPool}`} className="text-xs" />
    </Row>
  );
}

function SnapshotPendingRow({ item }: { item: ItemOf<"snapshotPending"> }) {
  const clusterName = useClusterName();
  return (
    <Row
      severity={item.severity}
      name={
        <CellLink
          to={PATH_AGENT_ACTOR_DETAIL_FULL}
          params={{ clusterName, atespace: item.atespace, name: item.name }}
          search={{ tab: "snapshot" }}
          text={item.name}
        />
      }
      aside={<RelativeTime at={item.updatedAt} label="Last change" />}
    >
      <span>Snapshot generation {item.generation} pending</span>
    </Row>
  );
}

function AttentionRow({ item }: { item: AttentionItem }) {
  switch (item.kind) {
    case "actorCrashed":
      return <ActorCrashedRow item={item} />;
    case "workerPoolNotReady":
      return <WorkerPoolNotReadyRow item={item} />;
    case "workerNotActive":
      return <WorkerNotActiveRow item={item} />;
    case "snapshotPending":
      return <SnapshotPendingRow item={item} />;
  }
}

const SHOW_ALL_TARGET: Record<AttentionKind, { to: string; search?: Record<string, string> }> = {
  actorCrashed: {
    to: PATH_AGENT_ACTORS_FULL,
    search: { [ACTOR_FILTER_NAMES.ACTOR_STATE]: actorStateGroupSchema.enum.crashed },
  },
  workerPoolNotReady: { to: PATH_AGENT_WORKER_POOLS_FULL },
  workerNotActive: { to: PATH_AGENT_WORKER_POOLS_FULL, search: WORKERS_SEARCH },
  snapshotPending: { to: PATH_AGENT_ACTORS_FULL },
};

function ShowAllLink({ kind }: { kind: AttentionKind }) {
  const clusterName = useClusterName();
  const { to, search } = SHOW_ALL_TARGET[kind];
  return (
    <Link
      to={to}
      params={{ clusterName }}
      search={search}
      aria-label={`Show all ${groupTitle(kind).toLowerCase()}`}
      className="text-muted-foreground hover:text-foreground text-xs"
    >
      Show all
    </Link>
  );
}

function AttentionGroupCard({ group }: { group: AttentionGroup }) {
  const titleId = React.useId();
  return (
    <Card role="region" aria-labelledby={titleId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 pb-2">
        <CardTitle id={titleId} className="text-sm font-semibold">
          {groupTitle(group.kind)} ({group.items.length})
        </CardTitle>
        {group.items.length > NEEDS_ATTENTION_MAX_ROWS && <ShowAllLink kind={group.kind} />}
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <ul className="space-y-2.5">
          {group.items.slice(0, NEEDS_ATTENTION_MAX_ROWS).map((item) => (
            <AttentionRow key={rowKey(item)} item={item} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function rowKey(item: AttentionItem): string {
  switch (item.kind) {
    case "actorCrashed":
    case "snapshotPending":
      return JSON.stringify([item.atespace, item.name]);
    case "workerPoolNotReady":
      return JSON.stringify([item.namespace, item.name]);
    case "workerNotActive":
      return JSON.stringify([item.workerNamespace, item.workerPool, item.name]);
  }
}

/** Groups follow the order of `fleet.needsAttention`: errors first (packages/trpc fleet/needsAttention.ts). */
export function NeedsAttention({ fleet }: { fleet: ReadyFleet }) {
  const headingId = React.useId();
  const groups = React.useMemo(() => groupAttentionItems(fleet.needsAttention), [fleet.needsAttention]);
  const workerPoolCheck = workerPoolCheckOf(fleet.workerPools);
  const notChecked = notCheckedText(workerPoolCheck);
  const AllClearIcon = notChecked === null ? CircleCheck : CircleAlert;

  return (
    <section aria-labelledby={headingId}>
      <SectionHeading id={headingId}>Needs attention</SectionHeading>
      {groups.length === 0 ? (
        <div className="flex flex-col gap-1 py-2">
          <p
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              notChecked === null ? "text-status-success" : "text-status-missing"
            )}
          >
            <AllClearIcon className="size-4 shrink-0" aria-hidden />
            {allClearText(workerPoolCheck)}
          </p>
          <p className="text-muted-foreground text-xs">
            {checkedText({ actors: fleet.summary.actors, workers: fleet.summary.workers }, workerPoolCheck)}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {notChecked !== null && <p className="text-status-missing text-xs font-medium">{notChecked}</p>}
          <div className="grid gap-4 lg:grid-cols-2">
            {groups.map((group) => (
              <AttentionGroupCard key={group.kind} group={group} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
