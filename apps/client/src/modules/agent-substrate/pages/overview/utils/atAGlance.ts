import {
  workerStateSchema,
  type ActorStateGroup,
  type AttentionSeverity,
  type FleetSummary,
  type ReadyFleet,
} from "@my-project/shared";
import { ACTOR_FILTER_NAMES, agentProfileFilterValue } from "../../../constants/actorFilter";
import { plural } from "../../../utils/plural";

export function actorsSubText({ agents, atespaces }: FleetSummary): string {
  const hosted = agents === 0 ? "No agent" : `${agents} ${agents === 1 ? "hosts" : "host"} an agent`;
  return `${hosted} · in ${plural(atespaces, "atespace")}`;
}

export interface WorkersHealth {
  /** As Needs attention: `warning` when the only inactive workers are draining; an active, unregistered worker is also `warning`. */
  severity: "ok" | AttentionSeverity;
  text: string;
}

export function workersHealth({ summary, workers }: Pick<ReadyFleet, "summary" | "workers">): WorkersHealth | null {
  if (summary.workers === 0) return null;
  const { workersByState } = summary;
  const notActive = workerStateSchema.options.filter((state) => state !== "active" && workersByState[state] > 0);
  const notRegistered = workers.filter(({ state, registered }) => state === "active" && !registered).length;
  if (notActive.length === 0 && notRegistered === 0) return { severity: "ok", text: "All active" };

  const counts = notActive.map((state) => `${workersByState[state]} ${state}`);
  if (notRegistered > 0) counts.push(`${notRegistered} not registered`);
  return {
    severity: notActive.every((state) => state === "draining") ? "warning" : "error",
    text: counts.join(", "),
  };
}

/** Counts the worker pools that fleet room sums over: every one but `noTemplate`. */
export function roomSubText({ items }: ReadyFleet["workerPools"]): string {
  const counted = items.filter(({ roomState }) => roomState !== "noTemplate").length;
  return `across ${plural(counted, "worker pool")}`;
}

export function actorStateSearch(group: ActorStateGroup): Record<string, string> {
  return { [ACTOR_FILTER_NAMES.ACTOR_STATE]: group };
}

/** The Actors page search for one agent profile; null: agents whose actor template sets no `AGENT_PROFILE`. */
export function agentProfileSearch(agentProfile: string | null): Record<string, string> {
  return { [ACTOR_FILTER_NAMES.AGENT_PROFILE]: agentProfileFilterValue(agentProfile) };
}
