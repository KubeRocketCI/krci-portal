import { readFileSync } from "node:fs";
import path from "node:path";
import type { ActorState, ReadyFleetSnapshot, WorkerState } from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import {
  AgentSubstrateSourceError,
  MemoryAgentSubstrateSource,
  type MemoryFleet,
  type SubstrateActor,
  type SubstrateActorTemplate,
  type SubstrateWorker,
} from "../../../../clients/agentSubstrate/index.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { createCaller } from "../../../index.js";
import { AGENT_ENV } from "../../fleet/substrateRead.js";
import { CHECKED_ENV, IN_CLUSTER_ADDRESS } from "../../../../clients/agentSubstrate/__fixtures__/guards.js";

/** Written by scripts/record-agent-substrate-fixtures.ts. */
const TESTBED_MEMORY_FIXTURE = path.resolve(
  import.meta.dirname,
  "../../../../clients/agentSubstrate/__fixtures__/testbed.json"
);
const TESTBED_STORYBOOK_FIXTURE = path.resolve(
  import.meta.dirname,
  "../../../../../../../apps/client/src/modules/agent-substrate/__fixtures__/fleet.testbed.json"
);

const ATESPACE = "krci-agents";
const START = new Date("2026-11-22T10:00:00.000Z");

function actor(name: string, state: ActorState, template = name): SubstrateActor {
  return {
    atespace: ATESPACE,
    name,
    uid: `uid-${name}`,
    createTime: "2026-11-16T16:19:04.000Z",
    updateTime: "2026-11-16T16:52:03.000Z",
    actorTemplate: { atespace: ATESPACE, name: template },
    state,
    workerAssignment: null,
    crash: null,
    snapshots: [],
  };
}

/** The template the dispatcher writes for one issue. */
function issueTemplate(name: string, projectPath: string, projectId: string, iid: string): SubstrateActorTemplate {
  return {
    atespace: ATESPACE,
    name,
    uid: `tpl-${name}`,
    containers: [
      {
        name: "claude",
        env: [
          { name: "GITLAB_URL", value: "https://gitlab.internal.example" },
          { name: "PROJECT_ID", value: projectId },
          { name: "PROJECT_PATH", value: projectPath },
          { name: "ISSUE_IID", value: iid },
          { name: "BOT_USERNAME", value: "krci-bot" },
          { name: "SESSION_ID", value: "0d6c2f5e-session" },
          { name: "AGENT_PROFILE", value: "go" },
          { name: "ANTHROPIC_MODEL", value: "claude-haiku-5-5" },
        ],
      },
    ],
    limits: { cpuMillicores: 1000, memoryBytes: 2147483648 },
  };
}

/** A template that the dispatcher did not make. */
function plainTemplate(name: string): SubstrateActorTemplate {
  return {
    atespace: ATESPACE,
    name,
    uid: `tpl-${name}`,
    containers: [{ name: "app", env: [{ name: "LOG_LEVEL", value: "debug" }] }],
    limits: { cpuMillicores: 500, memoryBytes: 1073741824 },
  };
}

function worker(name: string, state: WorkerState): SubstrateWorker {
  return {
    name,
    workerPool: "workers",
    workerNamespace: ATESPACE,
    workerPod: `workers-${name}`,
    nodeName: "krci-control-plane",
    state,
    capacity: { cpuMillicores: 4000, memoryBytes: 8589934592, actors: 1000 },
    allocated: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
    sandboxClasses: ["gvisor"],
  };
}

const ATESPACES = [{ name: ATESPACE, uid: "as-1", createTime: "2026-11-10T08:00:00.000Z" }];

async function readyFleet(caller: ReturnType<typeof createCaller>): Promise<ReadyFleetSnapshot> {
  const snapshot = await caller.agentSubstrate.getFleet({});
  if (snapshot.state !== "ready") throw new Error(`expected a ready fleet, got ${snapshot.state}`);
  return snapshot;
}

describe("agentSubstrate.getFleet", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(START);
    mockContext = createMockedContext();
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns notConfigured with no network call when the context holds no Agent Substrate source", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const listResourceSpy = vi.spyOn(K8sClient.prototype, "listResource");
    const getResourceSpy = vi.spyOn(K8sClient.prototype, "getResource");

    const caller = createCaller(mockContext);
    const result = await caller.agentSubstrate.getFleet({});

    expect(result).toEqual({ state: "notConfigured" });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(listResourceSpy).not.toHaveBeenCalled();
    expect(getResourceSpy).not.toHaveBeenCalled();
  });

  it("serves a signed-in user who is not an administrator", async () => {
    mockContext.session.user!.data!.groups = ["developers"];

    const caller = createCaller(mockContext);

    await expect(caller.agentSubstrate.getFleet({})).resolves.toEqual({ state: "notConfigured" });
  });

  it("rejects a caller with no session with UNAUTHORIZED", async () => {
    mockContext.session.user = undefined;

    const caller = createCaller(mockContext);

    await expect(caller.agentSubstrate.getFleet({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it.each(["unavailable", "unauthenticated", "permissionDenied", "other"] as const)(
    "reports Agent Substrate unreachable with the reason %s",
    async (kind) => {
      const source = new MemoryAgentSubstrateSource({ atespaces: ATESPACES });
      source.failWith(new AgentSubstrateSourceError(kind, `substrate said ${kind}`));
      mockContext.agentSubstrateSource = source;

      const result = await createCaller(mockContext).agentSubstrate.getFleet({});

      expect(result).toEqual({ state: "unreachable", reason: kind });
    }
  );

  it("sends no error message to the client and logs it on the server once per read", async () => {
    const source = new MemoryAgentSubstrateSource({ atespaces: ATESPACES });
    const error = new AgentSubstrateSourceError("unavailable", "connect ECONNREFUSED 10.96.0.15:443");
    source.failWith(error);
    mockContext.agentSubstrateSource = source;
    const caller = createCaller(mockContext);

    const first = await caller.agentSubstrate.getFleet({});
    const cached = await caller.agentSubstrate.getFleet({});

    for (const result of [first, cached]) {
      expect(Object.keys(result).sort()).toEqual(["reason", "state"]);
      expect(JSON.stringify(result)).not.toContain("ECONNREFUSED");
    }
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith("[AgentSubstrate] Fleet read failed (unavailable):", error);
  });

  it("reports a ready fleet with zero counts when Agent Substrate has no atespaces", async () => {
    mockContext.agentSubstrateSource = new MemoryAgentSubstrateSource();

    const fleet = await readyFleet(createCaller(mockContext));

    expect(fleet.updatedAt).toBe(START.toISOString());
    expect(fleet.atespaces).toEqual([]);
    expect(fleet.actors).toEqual([]);
    expect(fleet.summary).toEqual({
      atespaces: 0,
      agents: 0,
      actors: 0,
      actorsByState: { running: 0, transitional: 0, suspended: 0, crashed: 0, unknown: 0 },
      workers: 0,
      workersByState: { active: 0, draining: 0, unavailable: 0, unknown: 0 },
    });
  });

  it("counts agents, all actors, actors by actor state and workers by worker state", async () => {
    mockContext.agentSubstrateSource = new MemoryAgentSubstrateSource({
      atespaces: ATESPACES,
      actors: [
        actor("issue-2-25", "running"),
        actor("issue-2-26", "suspended"),
        actor("issue-5-3", "suspended"),
        actor("issue-5-4", "crashed"),
        actor("issue-6-2", "resuming"),
        actor("issue-6-3", "suspending"),
        actor("debug-shell", "deleting"),
        actor("reverting-one", "reverting"),
        actor("future-state", "transitional"),
        actor("unreadable", "unknown"),
      ],
      actorTemplates: [
        issueTemplate("issue-2-25", "krci/test-go-app", "2", "25"),
        issueTemplate("issue-2-26", "krci/test-go-app", "2", "26"),
        issueTemplate("issue-5-3", "krci/test-python-app", "5", "3"),
        issueTemplate("issue-5-4", "krci/test-python-app", "5", "4"),
        issueTemplate("issue-6-2", "krci/test-node-app", "6", "2"),
        issueTemplate("issue-6-3", "krci/test-node-app", "6", "3"),
        plainTemplate("debug-shell"),
        plainTemplate("reverting-one"),
        plainTemplate("future-state"),
        plainTemplate("unreadable"),
      ],
      workers: [worker("w1", "active"), worker("w2", "active"), worker("w3", "draining"), worker("w4", "unavailable")],
    });

    const fleet = await readyFleet(createCaller(mockContext));

    expect(fleet.summary).toEqual({
      atespaces: 1,
      agents: 6,
      actors: 10,
      actorsByState: { running: 1, transitional: 5, suspended: 2, crashed: 1, unknown: 1 },
      workers: 4,
      workersByState: { active: 2, draining: 1, unavailable: 1, unknown: 0 },
    });
    expect(fleet.atespaces).toEqual([{ name: ATESPACE, uid: "as-1", createdAt: "2026-11-10T08:00:00.000Z" }]);
  });

  it("passes on only the AGENT_ENV template fields of an agent and a null agent for any other actor", async () => {
    mockContext.agentSubstrateSource = new MemoryAgentSubstrateSource({
      atespaces: ATESPACES,
      actors: [actor("issue-2-25", "suspended"), actor("debug-shell", "running")],
      actorTemplates: [issueTemplate("issue-2-25", "krci/test-go-app", "2", "25"), plainTemplate("debug-shell")],
    });

    const fleet = await readyFleet(createCaller(mockContext));

    expect(fleet.actors.map((row) => [row.name, row.agent])).toEqual([
      [
        "issue-2-25",
        {
          issue: { projectPath: "krci/test-go-app", projectId: "2", iid: "25", url: null },
          codebase: null,
          agentProfile: "go",
          model: "claude-haiku-5-5",
        },
      ],
      ["debug-shell", null],
    ]);
    const output = JSON.stringify(fleet);
    expect(output).not.toContain("0d6c2f5e-session");
    expect(output).not.toContain("gitlab.internal.example");
    expect(output).not.toContain("krci-bot");
    expect(output).not.toContain("LOG_LEVEL");
  });

  it("counts an actor whose template is gone as an actor but not as an agent", async () => {
    mockContext.agentSubstrateSource = new MemoryAgentSubstrateSource({
      atespaces: ATESPACES,
      actors: [actor("issue-2-25", "suspended"), actor("issue-2-26", "suspended")],
      actorTemplates: [issueTemplate("issue-2-25", "krci/test-go-app", "2", "25")],
    });

    const fleet = await readyFleet(createCaller(mockContext));

    expect(fleet.summary.actors).toBe(2);
    expect(fleet.summary.agents).toBe(1);
  });

  it("keeps the Agent Substrate read for 5 s and reads again after it", async () => {
    const source = new MemoryAgentSubstrateSource({ atespaces: ATESPACES, actors: [actor("a", "running")] });
    mockContext.agentSubstrateSource = source;
    const listActors = vi.spyOn(source, "listActors");
    const caller = createCaller(mockContext);

    const first = await readyFleet(caller);
    source.setFleet({ actors: [actor("a", "running"), actor("b", "suspended")] });
    vi.setSystemTime(START.getTime() + 4_999);
    const cached = await readyFleet(caller);
    vi.setSystemTime(START.getTime() + 5_000);
    const fresh = await readyFleet(caller);

    expect(cached.summary.actors).toBe(1);
    expect(cached.updatedAt).toBe(first.updatedAt);
    expect(fresh.summary.actors).toBe(2);
    expect(fresh.updatedAt).toBe(new Date(START.getTime() + 5_000).toISOString());
    expect(listActors).toHaveBeenCalledTimes(2);
  });

  it("shares the 5 s read between users", async () => {
    const source = new MemoryAgentSubstrateSource({ atespaces: ATESPACES });
    const listAtespaces = vi.spyOn(source, "listAtespaces");
    const otherUser = createMockedContext();
    otherUser.session.user!.data!.groups = ["developers"];
    mockContext.agentSubstrateSource = source;
    otherUser.agentSubstrateSource = source;

    await createCaller(mockContext).agentSubstrate.getFleet({});
    await createCaller(otherUser).agentSubstrate.getFleet({});

    expect(listAtespaces).toHaveBeenCalledTimes(1);
  });

  it("keeps an unreachable result for 5 s", async () => {
    const source = new MemoryAgentSubstrateSource({ atespaces: ATESPACES });
    source.failWith(new AgentSubstrateSourceError("unavailable", "connection refused"));
    mockContext.agentSubstrateSource = source;
    const caller = createCaller(mockContext);

    await caller.agentSubstrate.getFleet({});
    source.failWith(null);
    vi.setSystemTime(START.getTime() + 4_999);
    const cached = await caller.agentSubstrate.getFleet({});
    vi.setSystemTime(START.getTime() + 5_000);
    const fresh = await caller.agentSubstrate.getFleet({});

    expect(cached.state).toBe("unreachable");
    expect(fresh.state).toBe("ready");
  });

  it("merges concurrent calls into one Agent Substrate read", async () => {
    const source = new MemoryAgentSubstrateSource({
      atespaces: ATESPACES,
      actors: [actor("issue-2-25", "running")],
      actorTemplates: [issueTemplate("issue-2-25", "krci/test-go-app", "2", "25")],
    });
    mockContext.agentSubstrateSource = source;
    const reads = {
      listAtespaces: vi.spyOn(source, "listAtespaces"),
      listActors: vi.spyOn(source, "listActors"),
      listWorkers: vi.spyOn(source, "listWorkers"),
      getActorTemplate: vi.spyOn(source, "getActorTemplate"),
    };
    const caller = createCaller(mockContext);

    const results = await Promise.all([
      caller.agentSubstrate.getFleet({}),
      caller.agentSubstrate.getFleet({}),
      caller.agentSubstrate.getFleet({}),
    ]);

    expect(results.map((r) => r.state)).toEqual(["ready", "ready", "ready"]);
    for (const spy of Object.values(reads)) expect(spy).toHaveBeenCalledTimes(1);
  });

  it("reads the template of an actor once, not again on a later read", async () => {
    const source = new MemoryAgentSubstrateSource({
      atespaces: ATESPACES,
      actors: [actor("issue-2-25", "running")],
      actorTemplates: [issueTemplate("issue-2-25", "krci/test-go-app", "2", "25")],
    });
    mockContext.agentSubstrateSource = source;
    const getActorTemplate = vi.spyOn(source, "getActorTemplate");
    const caller = createCaller(mockContext);

    await readyFleet(caller);
    vi.setSystemTime(START.getTime() + 60_000);
    const later = await readyFleet(caller);

    expect(later.summary.agents).toBe(1);
    expect(getActorTemplate).toHaveBeenCalledTimes(1);
  });

  describe("recorded testbed fixtures", () => {
    const memoryFleet: MemoryFleet = JSON.parse(readFileSync(TESTBED_MEMORY_FIXTURE, "utf8"));
    const storybookSnapshot: ReadyFleetSnapshot = JSON.parse(readFileSync(TESTBED_STORYBOOK_FIXTURE, "utf8"));

    it.each([
      ["memory adapter", TESTBED_MEMORY_FIXTURE],
      ["Storybook", TESTBED_STORYBOOK_FIXTURE],
    ])("the %s fixture holds no session id, GitLab URL, bot name or in-cluster address", (_name, file) => {
      const json = readFileSync(file, "utf8");

      for (const name of CHECKED_ENV) expect(json).not.toContain(name);
      expect(json).not.toMatch(IN_CLUSTER_ADDRESS);
    });

    it("the memory adapter fixture keeps only the AGENT_ENV entries", () => {
      const names = new Set(
        memoryFleet.actorTemplates.flatMap((t) => t.containers.flatMap((c) => c.env.map((e) => e.name)))
      );

      expect([...names].sort()).toEqual(Object.values(AGENT_ENV).sort());
    });

    it("gives the Storybook snapshot when read through the memory adapter", async () => {
      vi.setSystemTime(new Date(storybookSnapshot.updatedAt));
      mockContext.agentSubstrateSource = new MemoryAgentSubstrateSource(memoryFleet);

      const fleet = await readyFleet(createCaller(mockContext));

      expect(fleet).toEqual(storybookSnapshot);
      expect(fleet.summary.actors).toBeGreaterThan(0);
    });
  });

  it("does not read a gone template again on a later read", async () => {
    const source = new MemoryAgentSubstrateSource({ atespaces: ATESPACES, actors: [actor("issue-2-25", "suspended")] });
    mockContext.agentSubstrateSource = source;
    const getActorTemplate = vi.spyOn(source, "getActorTemplate");
    const caller = createCaller(mockContext);

    await readyFleet(caller);
    vi.setSystemTime(START.getTime() + 60_000);
    const later = await readyFleet(caller);

    expect(later.summary.agents).toBe(0);
    expect(getActorTemplate).toHaveBeenCalledTimes(1);
  });

  it("reports unreachable with the reason other when a template read fails on the server", async () => {
    const source = new MemoryAgentSubstrateSource({ atespaces: ATESPACES, actors: [actor("issue-2-25", "running")] });
    vi.spyOn(source, "getActorTemplate").mockRejectedValue(new AgentSubstrateSourceError("other", "internal error"));
    mockContext.agentSubstrateSource = source;

    const result = await createCaller(mockContext).agentSubstrate.getFleet({});

    expect(result).toEqual({ state: "unreachable", reason: "other" });
  });

  it("reports unreachable when a template read fails on the network", async () => {
    const source = new MemoryAgentSubstrateSource({
      atespaces: ATESPACES,
      actors: [actor("issue-2-25", "running")],
      actorTemplates: [issueTemplate("issue-2-25", "krci/test-go-app", "2", "25")],
    });
    vi.spyOn(source, "getActorTemplate").mockRejectedValue(new AgentSubstrateSourceError("unavailable", "reset"));
    mockContext.agentSubstrateSource = source;

    const result = await createCaller(mockContext).agentSubstrate.getFleet({});

    expect(result).toEqual({ state: "unreachable", reason: "unavailable" });
  });
});
