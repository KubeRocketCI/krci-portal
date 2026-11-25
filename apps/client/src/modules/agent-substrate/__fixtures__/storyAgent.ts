import type { QueryClient } from "@tanstack/react-query";
import type {
  ActorRow,
  AgentActor,
  AgentDetail,
  AgentReviewRuns,
  ReadyAgentRead,
  ReadyFleet,
} from "@my-project/shared";
import { agentQueryKey, type AgentData, type AgentRef } from "../hooks/useAgent";
import { agentReviewRunsQueryKey } from "../hooks/useAgentReviewRuns";
import { FLEET_QUERY_KEY } from "../hooks/useFleet";
import { STORY_FLEET } from "./storyFleet";
import { NO_REVIEW_RUN } from "./storyReviewRuns";

// Testbed captures of one agent: issue-2-26 suspended, issue-2-32 running (go agent profile).

const ATESPACE = "krci-agents";
const PLATFORM_NAMESPACE = "krci";
const UPDATED_AT = "2026-11-24T18:15:00.000Z";
const GO_IMAGE = "epamedp/krci-agent-go:0.2.0@sha256:6b1f9a1edca599ea02e1620e2ae2d924782758140e9d48810c083dfa74431176";
const PYTHON_IMAGE =
  "epamedp/krci-agent-python:0.2.0@sha256:7cfe9b539727337a7752e62c8d4ef045d133e3043ed54d56dd21c0502f8ad30a";

function goAgent(iid: string): AgentDetail {
  return {
    issue: {
      projectPath: "krci/test-go-app",
      projectId: "2",
      iid,
      url: `https://gitlab.example.com/krci/test-go-app/-/issues/${iid}`,
    },
    codebase: { name: "test-go-app", namespace: PLATFORM_NAMESPACE },
    agentProfile: "go",
    model: "claude-haiku-5-5",
    issueBranch: `agent/issue-${iid}`,
    turnLimit: 20,
    agentImage: GO_IMAGE,
  };
}

function agentActor(name: string, fields: Partial<AgentActor>): AgentActor {
  return {
    atespace: ATESPACE,
    name,
    uid: `uid-${name}`,
    state: "suspended",
    actorTemplate: name,
    size: { cpuMillicores: 1000, memoryBytes: 2147483648 },
    workerSelector: { workload: "workers" },
    placement: null,
    crash: null,
    preferredSnapshotFidelity: "memory",
    newestSnapshot: { generation: 1, fidelity: "memory", sandboxClass: "gvisor" },
    createdAt: "2026-11-16T16:35:32.274Z",
    updatedAt: "2026-11-16T17:09:19.320Z",
    ...fields,
  };
}

function readyRead(result: ReadyAgentRead["result"]): ReadyAgentRead {
  return { state: "ready", updatedAt: UPDATED_AT, result };
}

export const RUNNING_AGENT = readyRead({
  kind: "agent",
  agent: goAgent("32"),
  actor: agentActor("issue-2-32", {
    state: "running",
    placement: {
      worker: "cbc51b4d-7570-49b9-bd9a-d5f1890bee37",
      workerPool: "workers",
      workerNamespace: ATESPACE,
      workerPod: "workers-7485fd78cd-wslff",
      node: "krci-control-plane",
      sandboxRuntime: "gvisor",
    },
    newestSnapshot: null,
    createdAt: "2026-11-24T18:02:11.000Z",
    updatedAt: "2026-11-24T18:10:40.000Z",
  }),
});

export const SUSPENDED_AGENT = readyRead({
  kind: "agent",
  agent: goAgent("26"),
  actor: agentActor("issue-2-26", {}),
});

export const ONE_TURN_AGENT = readyRead({
  kind: "agent",
  agent: { ...goAgent("26"), turnLimit: 1 },
  actor: agentActor("issue-2-26", {}),
});

export const CRASHED_AGENT = readyRead({
  kind: "agent",
  agent: {
    issue: {
      projectPath: "krci/test-python-app",
      projectId: "5",
      iid: "4",
      url: "https://gitlab.example.com/krci/test-python-app/-/issues/4",
    },
    codebase: { name: "test-python-app", namespace: PLATFORM_NAMESPACE },
    agentProfile: "python",
    model: "claude-haiku-5-5",
    issueBranch: "agent/issue-4",
    turnLimit: 20,
    agentImage: PYTHON_IMAGE,
  },
  actor: agentActor("issue-5-4", {
    state: "crashed",
    crash: { message: "sandbox exited with code 137: out of memory", at: "2026-11-22T21:40:11.000Z" },
  }),
});

/** No Codebase matches the project path, and the actor template sets no turn limit or image. */
export const UNLINKED_AGENT = readyRead({
  kind: "agent",
  agent: {
    ...goAgent("26"),
    issue: { projectPath: "krci/test-go-app", projectId: "2", iid: "26", url: null },
    codebase: null,
    turnLimit: null,
    agentImage: null,
  },
  actor: agentActor("issue-2-26", { preferredSnapshotFidelity: null, newestSnapshot: null }),
});

export const NOT_AN_AGENT = readyRead({ kind: "notAnAgent" });

export const ACTOR_NOT_FOUND = readyRead({ kind: "actorNotFound" });

export function agentRefOf(read: ReadyAgentRead): AgentRef {
  return read.result.kind === "agent"
    ? { atespace: read.result.actor.atespace, name: read.result.actor.name }
    : { atespace: ATESPACE, name: "debug-shell" };
}

/** STORY_FLEET with the running actor of RUNNING_AGENT, which the testbed capture of the fleet does not hold. */
export const STORY_FLEET_WITH_RUNNING_AGENT: ReadyFleet = (() => {
  const fleet = structuredClone(STORY_FLEET);
  const base = fleet.actors.find((row) => row.name === "issue-2-26");
  if (!base) throw new Error("STORY_FLEET has no actor issue-2-26");
  const running: ActorRow = { ...structuredClone(base), name: "issue-2-32", actorTemplate: "issue-2-32" };
  fleet.actors.push(running);
  return fleet;
})();

export function seedAgent(
  ref: AgentRef,
  read: AgentData | undefined,
  fleet: ReadyFleet = STORY_FLEET_WITH_RUNNING_AGENT,
  reviewRuns: AgentReviewRuns = NO_REVIEW_RUN
) {
  return (queryClient: QueryClient) => {
    if (read) queryClient.setQueryData(agentQueryKey(ref), read);
    queryClient.setQueryData(agentReviewRunsQueryKey(ref), reviewRuns);
    queryClient.setQueryData(FLEET_QUERY_KEY, fleet);
  };
}
