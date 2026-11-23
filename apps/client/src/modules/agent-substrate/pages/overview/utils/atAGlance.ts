import {
  workerStateSchema,
  type ActorStateGroup,
  type AttentionSeverity,
  type FleetSummary,
  type ReadyFleetSnapshot,
} from "@my-project/shared";
import { ACTOR_FILTER_NAMES, agentProfileFilterValue } from "../../../constants/actorFilter";
import { plural } from "../../../utils/plural";

export function agentsSubText({ actors, atespaces }: FleetSummary): string {
  return `of ${plural(actors, "actor")} in ${plural(atespaces, "atespace")}`;
}

export interface WorkersHealth {
  /** As Needs attention: `warning` when the only workers not active are draining. */
  severity: "ok" | AttentionSeverity;
  text: string;
}

/** Null with no worker. */
export function workersHealth({ workers, workersByState }: FleetSummary): WorkersHealth | null {
  if (workers === 0) return null;
  const notActive = workerStateSchema.options.filter((state) => state !== "active" && workersByState[state] > 0);
  if (notActive.length === 0) return { severity: "ok", text: "All active" };
  return {
    severity: notActive.every((state) => state === "draining") ? "warning" : "error",
    text: notActive.map((state) => `${workersByState[state]} ${state}`).join(", "),
  };
}

export function fleetRoom(workerPools: ReadyFleetSnapshot["workerPools"]): number {
  return workerPools.items.reduce((sum, { room }) => sum + room, 0);
}

export function roomSubText(workerPools: number): string {
  return `across ${plural(workerPools, "worker pool")}`;
}

/** The Actors page search for one actor state group. */
export function actorStateSearch(group: ActorStateGroup): Record<string, string> {
  return { [ACTOR_FILTER_NAMES.ACTOR_STATE]: group };
}

/** The Actors page search for one agent profile; null: agents whose actor template sets no `AGENT_PROFILE`. */
export function agentProfileSearch(agentProfile: string | null): Record<string, string> {
  return { [ACTOR_FILTER_NAMES.AGENT_PROFILE]: agentProfileFilterValue(agentProfile) };
}
