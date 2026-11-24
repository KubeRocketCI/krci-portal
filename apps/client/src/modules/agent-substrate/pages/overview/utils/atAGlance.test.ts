import { describe, expect, it } from "vitest";
import { actorStateGroupSchema, type ReadyFleet } from "@my-project/shared";
import {
  CRASHED_ACTOR_FLEET,
  DRAINING_WORKER_FLEET,
  EMPTY_FLEET,
  HEALTHY_FLEET,
  MANY_CRASHED_FLEET,
  SEVERAL_AGENT_PROFILES_FLEET,
  TESTBED_FLEET,
  UNREGISTERED_WORKER_FLEET,
  WORKERS_NOT_ACTIVE_FLEET,
} from "../../../__fixtures__/storyFleet";
import { ACTOR_FILTER_NAMES } from "../../../constants/actorFilter";
import { actorMatchFunctions } from "../../actors/list/components/ActorFilter/constants";
import { actorStateSearch, actorsSubText, agentProfileSearch, roomSubText, workersHealth } from "./atAGlance";

function summaryOf(fleet: ReadyFleet, patch: Partial<ReadyFleet["summary"]>) {
  return { ...fleet.summary, ...patch };
}

/** The workers of the fleet with its first active worker not registered. */
function unregistered(fleet: ReadyFleet) {
  const workers = structuredClone(fleet.workers);
  workers.find(({ state }) => state === "active")!.registered = false;
  return workers;
}

describe("actorsSubText", () => {
  it("names the agents the actors host and the atespaces, singular and plural", () => {
    expect(actorsSubText(summaryOf(EMPTY_FLEET, { agents: 5, atespaces: 2 }))).toBe("5 host an agent · in 2 atespaces");
    expect(actorsSubText(summaryOf(EMPTY_FLEET, { agents: 1, atespaces: 1 }))).toBe("1 hosts an agent · in 1 atespace");
  });

  it("says no agent when no actor hosts one", () => {
    expect(actorsSubText(summaryOf(EMPTY_FLEET, { agents: 0, atespaces: 2 }))).toBe("No agent · in 2 atespaces");
  });
});

describe("workersHealth", () => {
  it("gives no line with no worker", () => {
    expect(workersHealth(EMPTY_FLEET)).toBeNull();
  });

  it("gives All active when every worker is active and registered", () => {
    expect(workersHealth(HEALTHY_FLEET)).toEqual({ severity: "ok", text: "All active" });
  });

  it("gives draining workers alone as a warning, as Needs attention does", () => {
    expect(workersHealth(DRAINING_WORKER_FLEET)).toEqual({ severity: "warning", text: "1 draining" });
  });

  it("gives an unavailable or unknown worker as an error", () => {
    for (const state of ["unavailable", "unknown"] as const) {
      expect(
        workersHealth({
          ...HEALTHY_FLEET,
          summary: summaryOf(HEALTHY_FLEET, {
            workersByState: { active: 2, draining: 0, unavailable: 0, unknown: 0, [state]: 1 },
          }),
        })
      ).toEqual({ severity: "error", text: `1 ${state}` });
    }
  });

  it("gives an active worker that is not registered as a warning, after the worker states", () => {
    expect(workersHealth(UNREGISTERED_WORKER_FLEET)).toEqual({ severity: "warning", text: "1 not registered" });
    expect(workersHealth({ ...DRAINING_WORKER_FLEET, workers: unregistered(DRAINING_WORKER_FLEET) })).toEqual({
      severity: "warning",
      text: "1 draining, 1 not registered",
    });
  });

  it("counts a worker that is not active and not registered once, under its state", () => {
    const fleet = structuredClone(DRAINING_WORKER_FLEET);
    for (const worker of fleet.workers) if (worker.state === "draining") worker.registered = false;

    expect(workersHealth(fleet)).toEqual({ severity: "warning", text: "1 draining" });
  });

  it("gives the count of each worker state that is not active, in worker state order", () => {
    expect(
      workersHealth({
        ...WORKERS_NOT_ACTIVE_FLEET,
        summary: summaryOf(WORKERS_NOT_ACTIVE_FLEET, {
          workersByState: { active: 1, draining: 1, unavailable: 2, unknown: 1 },
        }),
      })
    ).toEqual({ severity: "error", text: "1 draining, 2 unavailable, 1 unknown" });
  });
});

describe("roomSubText", () => {
  it("names the worker pools, singular and plural", () => {
    expect(roomSubText(2)).toBe("across 2 worker pools");
    expect(roomSubText(1)).toBe("across 1 worker pool");
  });
});

describe("At a glance counts match the Actors page filters", () => {
  const fleets = {
    TESTBED_FLEET,
    HEALTHY_FLEET,
    CRASHED_ACTOR_FLEET,
    MANY_CRASHED_FLEET,
    DRAINING_WORKER_FLEET,
    SEVERAL_AGENT_PROFILES_FLEET,
  };

  const matching = (fleet: ReadyFleet, search: Record<string, string>) =>
    fleet.actors.filter((actor) =>
      Object.entries(search).every(([name, value]) =>
        actorMatchFunctions[name as keyof typeof actorMatchFunctions]!(actor, value)
      )
    ).length;

  it.each(Object.entries(fleets))("%s: each actor state count is the actor rows of its filter", (_name, fleet) => {
    for (const group of actorStateGroupSchema.options) {
      expect(matching(fleet, actorStateSearch(group))).toBe(fleet.summary.actorsByState[group]);
    }
  });

  it.each(Object.entries(fleets))("%s: each agent profile count is the actor rows of its filter", (_name, fleet) => {
    expect(fleet.summary.agentsByProfile.length).toBeGreaterThan(0);
    for (const { agentProfile, agents } of fleet.summary.agentsByProfile) {
      expect(matching(fleet, agentProfileSearch(agentProfile))).toBe(agents);
    }
    expect(fleet.summary.agentsByProfile.reduce((sum, { agents }) => sum + agents, 0)).toBe(fleet.summary.agents);
  });

  it.each(Object.entries(fleets))("%s: the worker count is the Workers page rows", (_name, fleet) => {
    expect(fleet.summary.workers).toBe(fleet.workers.length);
    expect(fleet.summary.actors).toBe(fleet.actors.length);
  });

  it("filters the agents with no agent profile apart from actors that the dispatcher did not make", () => {
    expect(SEVERAL_AGENT_PROFILES_FLEET.actors.some(({ agent }) => agent === null)).toBe(true);
    expect(matching(SEVERAL_AGENT_PROFILES_FLEET, agentProfileSearch(null))).toBe(1);
    expect(agentProfileSearch(null)).toEqual({ [ACTOR_FILTER_NAMES.AGENT_PROFILE]: "__none__" });
  });
});
