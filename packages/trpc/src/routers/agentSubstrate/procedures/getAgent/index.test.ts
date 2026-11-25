import {
  K8sApiError,
  k8sCodebaseConfig,
  k8sGitServerConfig,
  type ActorState,
  type K8sResourceConfig,
  type ReadyAgentRead,
} from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import {
  AgentSubstrateSourceError,
  MemoryAgentSubstrateSource,
  type MemoryEgressPolicy,
  type SubstrateActor,
  type SubstrateActorTemplate,
} from "../../../../clients/agentSubstrate/index.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { createCaller } from "../../../index.js";

const ATESPACE = "krci-agents";
const PLATFORM_NAMESPACE = "krci";
const START = new Date("2026-11-24T18:15:00.000Z");
const GO_IMAGE = "epamedp/krci-agent-go:0.2.0@sha256:6b1f9a1edca599ea02e1620e2ae2d924782758140e9d48810c083dfa74431176";

/** Env values of the dispatcher that the portal never passes to the browser. */
const HIDDEN_ENV = {
  GITLAB_URL: "https://gitlab.internal.example",
  BOT_USERNAME: "krci-bot",
  SESSION_ID: "0d6c2f5e-session",
  GOPROXY: "https://proxy.golang.org",
  GOSUMDB: "sum.golang.org",
};

function actor(name: string, state: ActorState, fields: Partial<SubstrateActor> = {}): SubstrateActor {
  return {
    atespace: ATESPACE,
    name,
    uid: `uid-${name}`,
    createTime: "2026-11-16T16:35:32.274Z",
    updateTime: "2026-11-16T17:09:19.320Z",
    actorTemplate: { atespace: ATESPACE, name },
    state,
    workerAssignment: null,
    crash: null,
    snapshots: [
      {
        uuid: `snap-${name}-1`,
        generation: 1,
        fidelity: "memory",
        locality: null,
        durableState: "completed",
        sandboxClass: "gvisor",
      },
    ],
    ...fields,
  };
}

/** The go actor template the dispatcher writes, as captured on the testbed. */
function goActorTemplate(name: string, iid: string, env: Record<string, string> = {}): SubstrateActorTemplate {
  const values: Record<string, string> = {
    GITLAB_URL: HIDDEN_ENV.GITLAB_URL,
    PROJECT_ID: "2",
    PROJECT_PATH: "krci/test-go-app",
    ISSUE_IID: iid,
    BOT_USERNAME: HIDDEN_ENV.BOT_USERNAME,
    SESSION_ID: HIDDEN_ENV.SESSION_ID,
    TURN_LIMIT: "20",
    AGENT_PROFILE: "go",
    ANTHROPIC_MODEL: "claude-haiku-5-5",
    GOPROXY: HIDDEN_ENV.GOPROXY,
    GOSUMDB: HIDDEN_ENV.GOSUMDB,
    ...env,
  };
  return {
    atespace: ATESPACE,
    name,
    uid: `tpl-${name}`,
    containers: [
      {
        name: "claude",
        image: GO_IMAGE,
        env: Object.entries(values).map(([envName, value]) => ({ name: envName, value })),
      },
    ],
    limits: { cpuMillicores: 1000, memoryBytes: 2147483648 },
    workerSelector: { workload: "workers" },
    preferredSnapshotFidelity: "memory",
  };
}

function plainActorTemplate(name: string): SubstrateActorTemplate {
  return {
    atespace: ATESPACE,
    name,
    uid: `tpl-${name}`,
    containers: [{ name: "app", image: "busybox:1.37", env: [{ name: "LOG_LEVEL", value: "debug" }] }],
    limits: { cpuMillicores: 500, memoryBytes: 1073741824 },
    workerSelector: {},
    preferredSnapshotFidelity: null,
  };
}

const RUNNING = actor("issue-2-32", "running", {
  workerAssignment: {
    worker: "cbc51b4d-7570-49b9-bd9a-d5f1890bee37",
    workerPool: "workers",
    workerNamespace: ATESPACE,
    workerPod: "workers-7485fd78cd-wslff",
    nodeName: "krci-control-plane",
    sandboxRuntime: "gvisor",
  },
  snapshots: [],
});
const SUSPENDED = actor("issue-2-26", "suspended");
const CRASHED = actor("issue-2-27", "crashed", {
  crash: { message: "sandbox exited with code 137: out of memory", crashTime: "2026-11-24T18:01:00.000Z" },
});

/** The go egress policy the dispatcher writes, as captured on the testbed. */
function goEgressPolicy(name: string): MemoryEgressPolicy {
  return {
    actor: { atespace: ATESPACE, name },
    rules: [
      {
        kind: "https",
        hosts: ["api.anthropic.com"],
        ports: [443],
        credentials: [{ header: "x-api-key", prefix: null }],
      },
      {
        kind: "https",
        hosts: ["gitlab.example.com"],
        ports: [443],
        credentials: [
          { header: "Authorization", prefix: "Basic " },
          { header: "PRIVATE-TOKEN", prefix: null },
        ],
      },
      {
        kind: "tlsPassthrough",
        hosts: ["proxy.golang.org", "sum.golang.org", "storage.googleapis.com"],
        ports: [443],
        credentials: [],
      },
    ],
  };
}

function agentSource(): MemoryAgentSubstrateSource {
  return new MemoryAgentSubstrateSource({
    actors: [RUNNING, SUSPENDED, CRASHED, actor("debug-shell", "running"), actor("gone-template", "suspended")],
    actorTemplates: [
      goActorTemplate("issue-2-32", "32"),
      goActorTemplate("issue-2-26", "26"),
      goActorTemplate("issue-2-27", "27"),
      plainActorTemplate("debug-shell"),
    ],
    // The suspended actor issue-2-26 has no egress policy.
    egressPolicies: [goEgressPolicy("issue-2-32"), goEgressPolicy("issue-2-27")],
  });
}

const forbidden = () => new K8sApiError(403, "Forbidden", "");

/** Codebase list and GitServer reads in PLATFORM_NAMESPACE; anything not given: 403. */
function stubK8s({ codebases, gitServers = {} }: { codebases?: unknown[]; gitServers?: Record<string, unknown> }) {
  const list = vi
    .spyOn(K8sClient.prototype, "listResource")
    .mockImplementation(async (config: K8sResourceConfig, namespace?: string) => {
      if (config !== k8sCodebaseConfig || namespace !== PLATFORM_NAMESPACE || codebases === undefined) {
        throw forbidden();
      }
      return { items: codebases } as never;
    });
  const get = vi
    .spyOn(K8sClient.prototype, "getResource")
    .mockImplementation(async (config: K8sResourceConfig, name: string, namespace?: string) => {
      const server = config === k8sGitServerConfig && namespace === PLATFORM_NAMESPACE ? gitServers[name] : undefined;
      if (server === undefined) throw forbidden();
      return server as never;
    });
  return { list, get };
}

const GO_CODEBASE = {
  metadata: { name: "test-go-app", namespace: PLATFORM_NAMESPACE },
  spec: { gitUrlPath: "/krci/test-go-app", gitServer: "gitlab" },
  status: { gitWebUrl: "https://gitlab.example.com/krci/test-go-app" },
};
const GITLAB = {
  gitlab: {
    metadata: { name: "gitlab", namespace: PLATFORM_NAMESPACE },
    spec: { gitProvider: "gitlab", gitHost: "gitlab.example.com", httpsPort: 443 },
  },
};

async function readyRead(caller: ReturnType<typeof createCaller>, name: string): Promise<ReadyAgentRead> {
  const read = await caller.agentSubstrate.getAgent({ atespace: ATESPACE, name });
  if (read.state !== "ready") throw new Error(`expected a ready read, got ${read.state}`);
  return read;
}

async function agentOf(caller: ReturnType<typeof createCaller>, name: string) {
  const { result } = await readyRead(caller, name);
  if (result.kind !== "agent") throw new Error(`expected an agent, got ${result.kind}`);
  return result;
}

describe("agentSubstrate.getAgent", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(START);
    mockContext = createMockedContext();
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("DEFAULT_CLUSTER_NAMESPACE", PLATFORM_NAMESPACE);
    stubK8s({ codebases: [GO_CODEBASE], gitServers: GITLAB });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns notConfigured with no read when the context holds no Agent Substrate source", async () => {
    const listResource = vi.spyOn(K8sClient.prototype, "listResource");

    const read = await createCaller(mockContext).agentSubstrate.getAgent({ atespace: ATESPACE, name: "issue-2-32" });

    expect(read).toEqual({ state: "notConfigured" });
    expect(listResource).not.toHaveBeenCalled();
  });

  it("rejects a caller with no session with UNAUTHORIZED", async () => {
    mockContext.session.user = undefined;

    await expect(
      createCaller(mockContext).agentSubstrate.getAgent({ atespace: ATESPACE, name: "issue-2-32" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it.each([
    ["an empty atespace", { atespace: "", name: "issue-2-32" }],
    ["an empty name", { atespace: ATESPACE, name: "" }],
    ["an extra key", { atespace: ATESPACE, name: "issue-2-32", uid: "x" }],
    ["an uppercase name", { atespace: ATESPACE, name: "Issue-2-32" }],
    ["an underscore in the name", { atespace: ATESPACE, name: "issue_2_32" }],
    ["a name of 64 characters", { atespace: ATESPACE, name: "a".repeat(64) }],
    ["a name that ends with a dash", { atespace: ATESPACE, name: "issue-" }],
    ["an atespace with a dot", { atespace: "krci.agents", name: "issue-2-32" }],
  ])("rejects an input with %s with BAD_REQUEST", async (_case, input) => {
    mockContext.agentSubstrateSource = agentSource();

    await expect(
      createCaller(mockContext).agentSubstrate.getAgent(input as { atespace: string; name: string })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("gives a running agent with its issue link, Codebase, issue branch, agent profile and worker assignment", async () => {
    mockContext.agentSubstrateSource = agentSource();

    const read = await readyRead(createCaller(mockContext), "issue-2-32");

    expect(read).toEqual({
      state: "ready",
      updatedAt: START.toISOString(),
      result: {
        kind: "agent",
        agent: {
          issue: {
            projectPath: "krci/test-go-app",
            projectId: "2",
            iid: "32",
            url: "https://gitlab.example.com/krci/test-go-app/-/issues/32",
          },
          codebase: { name: "test-go-app", namespace: PLATFORM_NAMESPACE },
          agentProfile: "go",
          model: "claude-haiku-5-5",
          issueBranch: "agent/issue-32",
          turnLimit: 20,
          agentImage: GO_IMAGE,
        },
        actor: {
          atespace: ATESPACE,
          name: "issue-2-32",
          uid: "uid-issue-2-32",
          state: "running",
          actorTemplate: "issue-2-32",
          size: { cpuMillicores: 1000, memoryBytes: 2147483648 },
          workerSelector: { workload: "workers" },
          placement: {
            worker: "cbc51b4d-7570-49b9-bd9a-d5f1890bee37",
            workerPool: "workers",
            workerNamespace: ATESPACE,
            workerPod: "workers-7485fd78cd-wslff",
            node: "krci-control-plane",
            sandboxRuntime: "gvisor",
          },
          crash: null,
          preferredSnapshotFidelity: "memory",
          newestSnapshot: null,
          createdAt: "2026-11-16T16:35:32.274Z",
          updatedAt: "2026-11-16T17:09:19.320Z",
        },
        egressPolicy: {
          state: "ready",
          rules: [
            {
              kind: "https",
              hosts: ["api.anthropic.com"],
              ports: [443],
              credentials: [{ header: "x-api-key", prefix: null }],
            },
            {
              kind: "https",
              hosts: ["gitlab.example.com"],
              ports: [443],
              credentials: [
                { header: "Authorization", prefix: "Basic " },
                { header: "PRIVATE-TOKEN", prefix: null },
              ],
            },
            {
              kind: "tlsPassthrough",
              hosts: ["proxy.golang.org", "sum.golang.org", "storage.googleapis.com"],
              ports: [443],
              credentials: [],
            },
          ],
        },
      },
    });
  });

  it("gives no egress policy to an agent whose actor has none", async () => {
    mockContext.agentSubstrateSource = agentSource();

    const { egressPolicy } = await agentOf(createCaller(mockContext), "issue-2-26");

    expect(egressPolicy).toEqual({ state: "none" });
  });

  it("passes on no credential URI of the egress policy", async () => {
    const policy = goEgressPolicy("issue-2-32");
    policy.rules[0].credentials[0] = {
      header: "x-api-key",
      prefix: null,
      credentialUri: "ate-secret://k8s.io/default/krci-agents/anthropic/api-key",
    } as (typeof policy.rules)[0]["credentials"][0];
    const source = agentSource();
    source.setFleet({ egressPolicies: [policy] });
    mockContext.agentSubstrateSource = source;

    const read = await readyRead(createCaller(mockContext), "issue-2-32");

    const output = JSON.stringify(read);
    expect(output).toContain("x-api-key");
    expect(output).not.toContain("ate-secret://");
    expect(output).not.toContain("credentialUri");
  });

  it("reads the egress policy of the actor by atespace and actor name", async () => {
    const source = agentSource();
    const getActorEgressPolicy = vi.spyOn(source, "getActorEgressPolicy");
    mockContext.agentSubstrateSource = source;

    await agentOf(createCaller(mockContext), "issue-2-32");

    expect(getActorEgressPolicy).toHaveBeenCalledWith({ atespace: ATESPACE, name: "issue-2-32" });
  });

  it("reads no egress policy for an actor that is not an agent", async () => {
    const source = agentSource();
    const getActorEgressPolicy = vi
      .spyOn(source, "getActorEgressPolicy")
      .mockRejectedValue(new AgentSubstrateSourceError("permissionDenied", "denied"));
    mockContext.agentSubstrateSource = source;

    const read = await readyRead(createCaller(mockContext), "debug-shell");

    expect(read.result).toEqual({ kind: "notAnAgent" });
    expect(getActorEgressPolicy).not.toHaveBeenCalled();
  });

  it("gives a suspended agent no worker assignment and the fidelity and sandbox class of its newest snapshot", async () => {
    const source = agentSource();
    source.setFleet({
      actors: [
        actor("issue-2-26", "suspended", {
          snapshots: [
            {
              uuid: "s2",
              generation: 2,
              fidelity: "rootfs",
              locality: null,
              durableState: "pending",
              sandboxClass: "microvm",
            },
            {
              uuid: "s1",
              generation: 1,
              fidelity: "memory",
              locality: null,
              durableState: "completed",
              sandboxClass: "gvisor",
            },
          ],
        }),
      ],
    });
    mockContext.agentSubstrateSource = source;

    const { actor: suspended } = await agentOf(createCaller(mockContext), "issue-2-26");

    expect(suspended.state).toBe("suspended");
    expect(suspended.placement).toBeNull();
    expect(suspended.newestSnapshot).toEqual({ generation: 2, fidelity: "rootfs", sandboxClass: "microvm" });
  });

  it("gives a crashed agent its crash message and time", async () => {
    mockContext.agentSubstrateSource = agentSource();

    const { actor: crashed } = await agentOf(createCaller(mockContext), "issue-2-27");

    expect(crashed.crash).toEqual({
      message: "sandbox exited with code 137: out of memory",
      at: "2026-11-24T18:01:00.000Z",
    });
  });

  it("passes on no env value outside the ADR 0001 list", async () => {
    mockContext.agentSubstrateSource = agentSource();

    const { agent, actor: running } = await agentOf(createCaller(mockContext), "issue-2-32");

    // Not the egress policy: its hosts hold sum.golang.org, the GOSUMDB value.
    const output = JSON.stringify({ agent, actor: running });
    for (const [name, value] of Object.entries(HIDDEN_ENV)) {
      expect(output).not.toContain(name);
      expect(output).not.toContain(value);
    }
  });

  it.each([
    ["unset", undefined],
    ["zero", "0"],
    ["not a number", "twenty"],
    ["a fraction", "2.5"],
    ["past the safe integer range", "9".repeat(20)],
    ["past the number range", `1${"0".repeat(400)}`],
  ])("gives no turn limit when TURN_LIMIT is %s", async (_case, turnLimit) => {
    const template = goActorTemplate("issue-2-32", "32");
    template.containers[0].env = template.containers[0].env.flatMap((entry) =>
      entry.name !== "TURN_LIMIT" ? [entry] : turnLimit === undefined ? [] : [{ ...entry, value: turnLimit }]
    );
    const source = agentSource();
    source.setFleet({ actorTemplates: [template] });
    mockContext.agentSubstrateSource = source;

    const { agent } = await agentOf(createCaller(mockContext), "issue-2-32");

    expect(agent.turnLimit).toBeNull();
  });

  it("gives the image of the container that names the issue when another container comes first", async () => {
    const template = goActorTemplate("issue-2-32", "32");
    template.containers.unshift({ name: "helper", image: "busybox:1.37", env: [] });
    const source = agentSource();
    source.setFleet({ actorTemplates: [template] });
    mockContext.agentSubstrateSource = source;

    const { agent } = await agentOf(createCaller(mockContext), "issue-2-32");

    expect(agent.agentImage).toBe(GO_IMAGE);
    expect(agent.agentProfile).toBe("go");
  });

  it("gives no agent image when the actor template has no container image", async () => {
    const template = goActorTemplate("issue-2-32", "32");
    template.containers[0].image = "";
    const source = agentSource();
    source.setFleet({ actorTemplates: [template] });
    mockContext.agentSubstrateSource = source;

    const { agent } = await agentOf(createCaller(mockContext), "issue-2-32");

    expect(agent.agentImage).toBeNull();
  });

  it.each([
    ["names no issue", "debug-shell"],
    ["is gone", "gone-template"],
  ])("gives notAnAgent when the actor template %s", async (_case, name) => {
    mockContext.agentSubstrateSource = agentSource();

    const read = await readyRead(createCaller(mockContext), name);

    expect(read.result).toEqual({ kind: "notAnAgent" });
    expect(JSON.stringify(read)).not.toContain("LOG_LEVEL");
  });

  it("gives actorNotFound when the atespace holds no actor of that name", async () => {
    mockContext.agentSubstrateSource = agentSource();

    const read = await readyRead(createCaller(mockContext), "issue-9-9");

    expect(read.result).toEqual({ kind: "actorNotFound" });
  });

  it.each(["unavailable", "unauthenticated", "permissionDenied", "other"] as const)(
    "reports Agent Substrate unreachable with the reason %s",
    async (kind) => {
      const source = agentSource();
      source.failWith(new AgentSubstrateSourceError(kind, `substrate said ${kind}`));
      mockContext.agentSubstrateSource = source;

      const read = await createCaller(mockContext).agentSubstrate.getAgent({ atespace: ATESPACE, name: "issue-2-32" });

      expect(read).toEqual({ state: "unreachable", reason: kind });
    }
  );

  it.each(["unavailable", "unauthenticated", "permissionDenied", "other"] as const)(
    "reports Agent Substrate unreachable with the reason %s when only the actor template read fails",
    async (kind) => {
      const source = agentSource();
      vi.spyOn(source, "getActorTemplate").mockRejectedValue(new AgentSubstrateSourceError(kind, "failed"));
      mockContext.agentSubstrateSource = source;

      const read = await createCaller(mockContext).agentSubstrate.getAgent({ atespace: ATESPACE, name: "issue-2-32" });

      expect(read).toEqual({ state: "unreachable", reason: kind });
    }
  );

  it.each(["unavailable", "unauthenticated", "permissionDenied", "other"] as const)(
    "gives the agent with an unreadable egress policy of the reason %s when only the egress policy read fails",
    async (kind) => {
      const source = agentSource();
      const error = new AgentSubstrateSourceError(kind, "egress read failed");
      vi.spyOn(source, "getActorEgressPolicy").mockRejectedValue(error);
      mockContext.agentSubstrateSource = source;

      const result = await agentOf(createCaller(mockContext), "issue-2-32");

      expect(result.egressPolicy).toEqual({ state: "unreadable", reason: kind });
      expect(result.agent.issue.iid).toBe("32");
      expect(JSON.stringify(result)).not.toContain("egress read failed");
      expect(consoleError).toHaveBeenCalledWith(`[AgentSubstrate] Egress policy read failed (${kind}):`, error);
    }
  );

  it("sends no error message to the client and logs it on the server", async () => {
    const source = agentSource();
    const error = new AgentSubstrateSourceError("unavailable", "connect ECONNREFUSED 10.96.0.15:443");
    source.failWith(error);
    mockContext.agentSubstrateSource = source;

    const read = await createCaller(mockContext).agentSubstrate.getAgent({ atespace: ATESPACE, name: "issue-2-32" });

    expect(JSON.stringify(read)).not.toContain("ECONNREFUSED");
    expect(consoleError).toHaveBeenCalledWith("[AgentSubstrate] Agent read failed (unavailable):", error);
  });

  it("reads one actor and its actor template, and no worker", async () => {
    const source = agentSource();
    const listActors = vi.spyOn(source, "listActors");
    const listWorkers = vi.spyOn(source, "listWorkers");
    const getActor = vi.spyOn(source, "getActor");
    mockContext.agentSubstrateSource = source;

    await agentOf(createCaller(mockContext), "issue-2-32");

    expect(getActor).toHaveBeenCalledWith({ atespace: ATESPACE, name: "issue-2-32" });
    expect(listActors).not.toHaveBeenCalled();
    expect(listWorkers).not.toHaveBeenCalled();
  });

  describe("Codebase of the agent", () => {
    it("gives the project path with no Codebase and no issue link when the Codebase list is denied", async () => {
      vi.restoreAllMocks();
      stubK8s({});
      mockContext.agentSubstrateSource = agentSource();

      const { agent } = await agentOf(createCaller(mockContext), "issue-2-32");

      expect(agent.codebase).toBeNull();
      expect(agent.issue).toEqual({ projectPath: "krci/test-go-app", projectId: "2", iid: "32", url: null });
    });

    it("reads no Codebase when DEFAULT_CLUSTER_NAMESPACE is not set", async () => {
      vi.stubEnv("DEFAULT_CLUSTER_NAMESPACE", undefined);
      const { list } = stubK8s({ codebases: [GO_CODEBASE], gitServers: GITLAB });
      mockContext.agentSubstrateSource = agentSource();

      const { agent } = await agentOf(createCaller(mockContext), "issue-2-32");

      expect(agent.codebase).toBeNull();
      expect(list).not.toHaveBeenCalled();
    });

    it("reads no Codebase for an actor that is not an agent", async () => {
      const { list } = stubK8s({ codebases: [GO_CODEBASE], gitServers: GITLAB });
      mockContext.agentSubstrateSource = agentSource();

      await readyRead(createCaller(mockContext), "debug-shell");

      expect(list).not.toHaveBeenCalled();
    });
  });
});
