import type { AttentionItem, AttentionKind, ReadyFleet, WorkerPoolAccess } from "@my-project/shared";
import { plural } from "../../../utils/plural";

export const NEEDS_ATTENTION_MAX_ROWS = 5;

export interface AttentionGroup {
  kind: AttentionKind;
  items: AttentionItem[];
}

/** One group per kind, in the order of the first item of each kind; items keep their order. */
export function groupAttentionItems(items: AttentionItem[]): AttentionGroup[] {
  const groups = new Map<AttentionKind, AttentionGroup>();
  for (const item of items) {
    const group = groups.get(item.kind);
    if (group) {
      group.items.push(item);
    } else {
      groups.set(item.kind, { kind: item.kind, items: [item] });
    }
  }
  return [...groups.values()];
}

export function groupTitle(kind: AttentionKind): string {
  switch (kind) {
    case "actorCrashed":
      return "Crashed actors";
    case "workerPoolNotReady":
      return "Worker pools not ready";
    case "workerNotActive":
      return "Workers not active";
    case "snapshotPending":
      return "Pending snapshots";
  }
}

const NOT_CHECKED_REASON: Record<Exclude<WorkerPoolAccess, "ok">, string> = {
  denied: "no access",
  error: "error",
};

export interface WorkerPoolCheck {
  access: WorkerPoolAccess;
  read: number;
  total: number;
}

export function workerPoolCheckOf({ access, items }: ReadyFleet["workerPools"]): WorkerPoolCheck {
  return { access, read: items.filter(({ resource }) => resource !== null).length, total: items.length };
}

export function notCheckedText({ access, read }: WorkerPoolCheck): string | null {
  if (access === "ok") return null;
  const reason = NOT_CHECKED_REASON[access];
  return read > 0 ? `Some worker pools not checked: ${reason}` : `Worker pools not checked: ${reason}`;
}

export function checkedText(
  { actors, workers }: { actors: number; workers: number },
  { access, read, total }: WorkerPoolCheck
): string {
  const actorsAndWorkers = `${plural(actors, "actor")}, ${plural(workers, "worker")}`;
  if (access === "ok") return `Checked ${actorsAndWorkers} and ${plural(total, "worker pool")}.`;
  if (read > 0) return `Checked ${actorsAndWorkers} and ${read} of ${plural(total, "worker pool")}.`;
  return `Checked ${plural(actors, "actor")} and ${plural(workers, "worker")}.`;
}

export function allClearText({ access, read }: WorkerPoolCheck): string {
  if (access === "ok") return "Nothing needs attention";
  const reason = NOT_CHECKED_REASON[access];
  if (read > 0) {
    return `Nothing needs attention in actors, workers and the worker pools checked; some worker pools not checked (${reason})`;
  }
  return `Nothing needs attention in actors and workers; worker pools not checked (${reason})`;
}
