import { readFileSync } from "node:fs";
import path from "node:path";
import {
  K8sApiError,
  k8sCodebaseConfig,
  k8sGitServerConfig,
  k8sWorkerPoolConfig,
  type ActorState,
  type K8sResourceConfig,
  type ReadyFleetSnapshot,
  type SnapshotDurableState,
  type WorkerState,
} from "@my-project/shared";
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

/** The template the dispatcher writes for one issue. `agentProfile` "": the dispatcher set no AGENT_PROFILE. */
function issueTemplate(
  name: string,
  projectPath: string,
  projectId: string,
  iid: string,
  agentProfile = "go"
): SubstrateActorTemplate {
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
          { name: "AGENT_PROFILE", value: agentProfile },
          { name: "ANTHROPIC_MODEL", value: "claude-haiku-5-5" },
        ],
      },
    ],
    limits: { cpuMillicores: 1000, memoryBytes: 2147483648 },
  };
}

const GIB = 1024 ** 3;
const MIB = 1024 ** 2;

/** A template that the dispatcher did not make. */
function plainTemplate(
  name: string,
  limits: SubstrateActorTemplate["limits"] = { cpuMillicores: 500, memoryBytes: GIB }
): SubstrateActorTemplate {
  return {
    atespace: ATESPACE,
    name,
    uid: `tpl-${name}`,
    containers: [{ name: "app", env: [{ name: "LOG_LEVEL", value: "debug" }] }],
    limits,
  };
}

function worker(name: string, state: WorkerState, fields: Partial<SubstrateWorker> = {}): SubstrateWorker {
  return {
    name,
    workerPool: "workers",
    workerNamespace: ATESPACE,
    workerPod: `workers-${name}`,
    nodeName: "krci-control-plane",
    state,
    capacity: { cpuMillicores: 4000, memoryBytes: 8 * GIB, actors: 1000 },
    allocated: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
    sandboxClasses: ["gvisor"],
    registered: true,
    actorOverhead: null,
    ...fields,
  };
}

function workerPool(
  namespace: string,
  name: string,
  { replicas = 1, readyReplicas = 1, sandboxClass = "gvisor", resolution = "Resolved" as string | null } = {}
) {
  return {
    apiVersion: "ate.dev/v1",
    kind: "WorkerPool",
    metadata: { name, namespace, uid: `wp-${name}`, creationTimestamp: "2026-11-10T13:30:35Z" },
    spec: { replicas, sandboxClasses: [{ name: sandboxClass }] },
    status: {
      replicas,
      readyReplicas,
      sandboxClasses: [
        {
          name: sandboxClass,
          conditions: resolution ? [{ type: "Resolved", status: "True", reason: resolution }] : [],
        },
      ],
    },
  };
}

const ATESPACES = [{ name: ATESPACE, uid: "as-1", createTime: "2026-11-10T08:00:00.000Z" }];

/** `DEFAULT_CLUSTER_NAMESPACE` in the Codebase tests. */
const PLATFORM_NAMESPACE = "krci";

/** `gitWebUrl` defaults to the one the codebase operator writes for a GitLab GitServer on gitlab.example.com. */
function codebase(
  name: string,
  gitUrlPath: string,
  gitServer = "gitlab",
  gitWebUrl = `https://gitlab.example.com${gitUrlPath}`
) {
  return {
    metadata: { name, namespace: PLATFORM_NAMESPACE },
    spec: { gitUrlPath, gitServer },
    status: { gitWebUrl },
  };
}

function gitServer(name: string, gitProvider: string, gitHost = `${name}.example.com`, httpsPort = 443) {
  return { metadata: { name, namespace: PLATFORM_NAMESPACE }, spec: { gitProvider, gitHost, httpsPort } };
}

const forbidden = () => new K8sApiError(403, "Forbidden", "");

/**
 * Answers Codebase list and GitServer reads in PLATFORM_NAMESPACE (anything not given: 403), and WorkerPool lists by
 * namespace (a namespace not given: no WorkerPool; no namespace: 403).
 */
function stubK8s({
  codebases,
  gitServers = {},
  workerPools = {},
}: {
  codebases?: unknown[] | Error;
  gitServers?: Record<string, unknown>;
  workerPools?: Record<string, unknown[] | Error>;
}) {
  const list = vi
    .spyOn(K8sClient.prototype, "listResource")
    .mockImplementation(async (config: K8sResourceConfig, namespace?: string) => {
      if (config === k8sWorkerPoolConfig) {
        if (!namespace) throw forbidden();
        const pools = workerPools[namespace] ?? [];
        if (pools instanceof Error) throw pools;
        return { items: pools } as never;
      }
      if (config !== k8sCodebaseConfig || namespace !== PLATFORM_NAMESPACE || codebases === undefined) {
        throw forbidden();
      }
      if (codebases instanceof Error) throw codebases;
      return { items: codebases } as never;
    });
  const get = vi
    .spyOn(K8sClient.prototype, "getResource")
    .mockImplementation(async (config: K8sResourceConfig, name: string, namespace?: string) => {
      const server = config === k8sGitServerConfig && namespace === PLATFORM_NAMESPACE ? gitServers[name] : undefined;
      if (server === undefined) throw forbidden();
      if (server instanceof Error) throw server;
      return server as never;
    });
  return { list, get };
}

const GITLAB = { gitlab: gitServer("gitlab", "gitlab") };

function listedNamespaces(list: ReturnType<typeof stubK8s>["list"], config: K8sResourceConfig) {
  return list.mock.calls.filter(([listed]) => listed === config).map(([, namespace]) => namespace);
}

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
    stubK8s({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
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
      agentsByProfile: [],
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
        issueTemplate("issue-5-3", "krci/test-python-app", "5", "3", "python"),
        issueTemplate("issue-5-4", "krci/test-python-app", "5", "4", "python"),
        issueTemplate("issue-6-2", "krci/test-node-app", "6", "2", "node"),
        issueTemplate("issue-6-3", "krci/test-node-app", "6", "3", "node"),
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
      agentsByProfile: [
        { agentProfile: "go", agents: 2 },
        { agentProfile: "node", agents: 2 },
        { agentProfile: "python", agents: 2 },
      ],
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

  it("counts agents per agent profile by name, agents with no agent profile last, other actors in none", async () => {
    mockContext.agentSubstrateSource = new MemoryAgentSubstrateSource({
      atespaces: ATESPACES,
      actors: [
        actor("issue-9-1", "running"),
        actor("issue-2-25", "suspended"),
        actor("issue-2-26", "crashed"),
        actor("issue-7-1", "suspended"),
        actor("debug-shell", "running"),
        actor("gone-template", "suspended"),
      ],
      actorTemplates: [
        issueTemplate("issue-9-1", "krci/no-profile-app", "9", "1", ""),
        issueTemplate("issue-2-25", "krci/test-go-app", "2", "25", "python"),
        issueTemplate("issue-2-26", "krci/test-go-app", "2", "26", "go"),
        issueTemplate("issue-7-1", "krci/test-java-app", "7", "1", "go-1-26"),
        plainTemplate("debug-shell"),
      ],
    });

    const fleet = await readyFleet(createCaller(mockContext));

    expect(fleet.summary.agents).toBe(4);
    expect(fleet.summary.agentsByProfile).toEqual([
      { agentProfile: "go", agents: 1 },
      { agentProfile: "go-1-26", agents: 1 },
      { agentProfile: "python", agents: 1 },
      { agentProfile: null, agents: 1 },
    ]);
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

  describe("Codebase of an agent", () => {
    beforeEach(() => {
      vi.stubEnv("DEFAULT_CLUSTER_NAMESPACE", PLATFORM_NAMESPACE);
    });

    function goAgentSource() {
      return new MemoryAgentSubstrateSource({
        atespaces: ATESPACES,
        actors: [actor("issue-2-25", "running")],
        actorTemplates: [issueTemplate("issue-2-25", "krci/test-go-app", "2", "25")],
      });
    }

    it("links the Codebase whose gitUrlPath is the project path and the issue under its gitWebUrl", async () => {
      mockContext.agentSubstrateSource = goAgentSource();
      stubK8s({
        codebases: [codebase("other-app", "/krci/other-app"), codebase("go-app", "/krci/test-go-app")],
        gitServers: GITLAB,
      });

      const fleet = await readyFleet(createCaller(mockContext));

      expect(fleet.actors[0].agent).toMatchObject({
        issue: {
          projectPath: "krci/test-go-app",
          iid: "25",
          url: "https://gitlab.example.com/krci/test-go-app/-/issues/25",
        },
        codebase: { name: "go-app", namespace: PLATFORM_NAMESPACE },
      });
    });

    it("keeps the path prefix and port of gitWebUrl in the issue link", async () => {
      mockContext.agentSubstrateSource = goAgentSource();
      stubK8s({
        codebases: [
          codebase("go-app", "/krci/test-go-app", "gitlab", "https://git.example.com:8443/gitlab/krci/test-go-app/"),
        ],
        gitServers: GITLAB,
      });

      const fleet = await readyFleet(createCaller(mockContext));

      expect(fleet.actors[0].agent?.issue.url).toBe("https://git.example.com:8443/gitlab/krci/test-go-app/-/issues/25");
    });

    it.each([
      [
        "adds the GitServer HTTPS port to a gitWebUrl on its host with no port",
        { gitHost: "gitlab.example.com", httpsPort: 8443, gitWebUrl: "https://gitlab.example.com/krci/test-go-app" },
        "https://gitlab.example.com:8443/krci/test-go-app/-/issues/25",
      ],
      [
        "reads a GitServer gitHost given with a scheme",
        {
          gitHost: "https://gitlab.example.com",
          httpsPort: 8443,
          gitWebUrl: "https://gitlab.example.com/krci/test-go-app",
        },
        "https://gitlab.example.com:8443/krci/test-go-app/-/issues/25",
      ],
      [
        "keeps the port that gitWebUrl names",
        {
          gitHost: "gitlab.example.com",
          httpsPort: 8443,
          gitWebUrl: "https://gitlab.example.com:9443/krci/test-go-app",
        },
        "https://gitlab.example.com:9443/krci/test-go-app/-/issues/25",
      ],
      [
        "adds no port to a gitWebUrl on another host",
        { gitHost: "gitlab.example.com", httpsPort: 8443, gitWebUrl: "https://git.example.org/krci/test-go-app" },
        "https://git.example.org/krci/test-go-app/-/issues/25",
      ],
      [
        "adds no port 443",
        { gitHost: "gitlab.example.com", httpsPort: 443, gitWebUrl: "https://gitlab.example.com/krci/test-go-app" },
        "https://gitlab.example.com/krci/test-go-app/-/issues/25",
      ],
    ])("%s", async (_case, { gitHost, httpsPort, gitWebUrl }, issueUrl) => {
      mockContext.agentSubstrateSource = goAgentSource();
      stubK8s({
        codebases: [codebase("go-app", "/krci/test-go-app", "gitlab", gitWebUrl)],
        gitServers: { gitlab: gitServer("gitlab", "gitlab", gitHost, httpsPort) },
      });

      const fleet = await readyFleet(createCaller(mockContext));

      expect(fleet.actors[0].agent?.issue.url).toBe(issueUrl);
    });

    it.each([
      ["names another repository", "https://gitlab.example.com/krci/other-app"],
      ["is not an http(s) URL", "ssh://git@gitlab.example.com/krci/test-go-app"],
      ["has a query", "https://gitlab.example.com/krci/test-go-app?tab=1"],
      ["is empty", ""],
    ])("links the Codebase but not the issue when gitWebUrl %s", async (_case, gitWebUrl) => {
      mockContext.agentSubstrateSource = goAgentSource();
      stubK8s({ codebases: [codebase("go-app", "/krci/test-go-app", "gitlab", gitWebUrl)], gitServers: GITLAB });

      const fleet = await readyFleet(createCaller(mockContext));

      expect(fleet.actors[0].agent).toMatchObject({ issue: { url: null }, codebase: { name: "go-app" } });
    });

    it("gives the project path as text and the issue with no link when the Codebase list is denied", async () => {
      mockContext.agentSubstrateSource = goAgentSource();
      const { list } = stubK8s({});

      const fleet = await readyFleet(createCaller(mockContext));

      expect(list).toHaveBeenCalled();
      expect(fleet.actors[0].agent).toMatchObject({
        issue: { projectPath: "krci/test-go-app", iid: "25", url: null },
        codebase: null,
      });
    });

    it("logs a Codebase list failure other than 403 on the server and gives text cells", async () => {
      mockContext.agentSubstrateSource = goAgentSource();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const outage = new K8sApiError(500, "Internal Server Error", "etcd timeout");
      stubK8s({ codebases: outage });

      const fleet = await readyFleet(createCaller(mockContext));

      expect(fleet.actors[0].agent).toMatchObject({ issue: { url: null }, codebase: null });
      expect(warn).toHaveBeenCalledWith("[AgentSubstrate] Codebase list in namespace krci failed:", outage);
    });

    it("does not log a 403 Codebase list or a 403 GitServer read", async () => {
      mockContext.agentSubstrateSource = goAgentSource();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      stubK8s({});
      await readyFleet(createCaller(mockContext));
      stubK8s({ codebases: [codebase("go-app", "/krci/test-go-app")] });
      vi.setSystemTime(START.getTime() + 5_000);
      await readyFleet(createCaller(mockContext));

      expect(warn).not.toHaveBeenCalled();
    });

    it("gives no Codebase and no issue link, and reads no GitServer, when no Codebase has the project path", async () => {
      mockContext.agentSubstrateSource = goAgentSource();
      const { get } = stubK8s({ codebases: [codebase("go-app", "/krci/test-go-app-fork")], gitServers: GITLAB });

      const fleet = await readyFleet(createCaller(mockContext));

      expect(fleet.actors[0].agent).toMatchObject({ issue: { url: null }, codebase: null });
      expect(get).not.toHaveBeenCalled();
    });

    it("links the Codebase but not the issue when its GitServer cannot be read", async () => {
      mockContext.agentSubstrateSource = goAgentSource();
      stubK8s({ codebases: [codebase("go-app", "/krci/test-go-app")] });

      const fleet = await readyFleet(createCaller(mockContext));

      expect(fleet.actors[0].agent).toMatchObject({
        issue: { url: null },
        codebase: { name: "go-app", namespace: PLATFORM_NAMESPACE },
      });
    });

    it("links the Codebase but not the issue when its GitServer is not GitLab", async () => {
      mockContext.agentSubstrateSource = goAgentSource();
      stubK8s({
        codebases: [codebase("go-app", "/krci/test-go-app", "github", "https://github.com/krci/test-go-app")],
        gitServers: { github: gitServer("github", "github") },
      });

      const fleet = await readyFleet(createCaller(mockContext));

      expect(fleet.actors[0].agent).toMatchObject({
        issue: { url: null },
        codebase: { name: "go-app", namespace: PLATFORM_NAMESPACE },
      });
    });

    it("reads each GitServer that matching Codebases name once, by name, in DEFAULT_CLUSTER_NAMESPACE", async () => {
      mockContext.agentSubstrateSource = goAgentSource();
      const { list, get } = stubK8s({
        codebases: [codebase("go-app", "/krci/test-go-app"), codebase("go-app-copy", "/krci/test-go-app")],
        gitServers: GITLAB,
      });

      const fleet = await readyFleet(createCaller(mockContext));

      expect(new Set(listedNamespaces(list, k8sCodebaseConfig))).toEqual(new Set([PLATFORM_NAMESPACE]));
      expect(get.mock.calls).toEqual([[k8sGitServerConfig, "gitlab", PLATFORM_NAMESPACE]]);
      expect(fleet.actors[0].agent?.issue.url).toBe("https://gitlab.example.com/krci/test-go-app/-/issues/25");
    });

    it("links the first Codebase by name and gives no issue link when matches name different repositories", async () => {
      mockContext.agentSubstrateSource = goAgentSource();
      stubK8s({
        codebases: [
          codebase(
            "go-app-mirror",
            "/krci/test-go-app",
            "gitlab-mirror",
            "https://mirror.example.com/krci/test-go-app"
          ),
          codebase("go-app", "/krci/test-go-app"),
        ],
        gitServers: { ...GITLAB, "gitlab-mirror": gitServer("gitlab-mirror", "gitlab") },
      });

      const fleet = await readyFleet(createCaller(mockContext));

      expect(fleet.actors[0].agent).toMatchObject({ issue: { url: null }, codebase: { name: "go-app" } });
    });

    it("reads no Codebase list when no actor serves an issue", async () => {
      mockContext.agentSubstrateSource = new MemoryAgentSubstrateSource({
        atespaces: ATESPACES,
        actors: [actor("debug-shell", "running")],
        actorTemplates: [plainTemplate("debug-shell")],
      });
      const { list } = stubK8s({});

      await readyFleet(createCaller(mockContext));

      expect(listedNamespaces(list, k8sCodebaseConfig)).toEqual([]);
    });

    it("reads no Codebase list when Agent Substrate is unreachable", async () => {
      const source = goAgentSource();
      source.failWith(new AgentSubstrateSourceError("unavailable", "connection refused"));
      mockContext.agentSubstrateSource = source;
      const { list } = stubK8s({});

      const result = await createCaller(mockContext).agentSubstrate.getFleet({});

      expect(result.state).toBe("unreachable");
      expect(list).not.toHaveBeenCalled();
    });

    it("does not match a Codebase whose gitUrlPath has no leading slash", async () => {
      mockContext.agentSubstrateSource = goAgentSource();
      stubK8s({ codebases: [codebase("go-app", "xkrci/test-go-app")], gitServers: GITLAB });

      const fleet = await readyFleet(createCaller(mockContext));

      expect(fleet.actors[0].agent?.codebase).toBeNull();
    });

    it("reads no Codebase list when DEFAULT_CLUSTER_NAMESPACE is not set", async () => {
      vi.stubEnv("DEFAULT_CLUSTER_NAMESPACE", "");
      mockContext.agentSubstrateSource = goAgentSource();
      const { list } = stubK8s({});

      const fleet = await readyFleet(createCaller(mockContext));

      expect(listedNamespaces(list, k8sCodebaseConfig)).toEqual([]);
      expect(fleet.actors[0].agent?.codebase).toBeNull();
    });

    it("gives an actor that the dispatcher did not make no agent while Codebases are readable", async () => {
      mockContext.agentSubstrateSource = new MemoryAgentSubstrateSource({
        atespaces: ATESPACES,
        actors: [actor("debug-shell", "running")],
        actorTemplates: [plainTemplate("debug-shell")],
      });
      stubK8s({ codebases: [codebase("go-app", "/krci/test-go-app")], gitServers: GITLAB });

      const fleet = await readyFleet(createCaller(mockContext));

      expect(fleet.actors[0].agent).toBeNull();
    });

    it("rejects an input with any key", async () => {
      mockContext.agentSubstrateSource = goAgentSource();

      await expect(
        createCaller(mockContext).agentSubstrate.getFleet({ namespaces: ["kube-system"] } as never)
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  it("passes an actor state that cannot be read as unknown on the row", async () => {
    mockContext.agentSubstrateSource = new MemoryAgentSubstrateSource({
      atespaces: ATESPACES,
      actors: [actor("unreadable", "unknown"), actor("future-state", "transitional")],
    });

    const fleet = await readyFleet(createCaller(mockContext));

    expect(fleet.actors.map((row) => [row.name, row.state])).toEqual([
      ["unreadable", "unknown"],
      ["future-state", "transitional"],
    ]);
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

  describe("needs attention", () => {
    async function needsAttentionOf(fleet: Partial<MemoryFleet>) {
      mockContext.agentSubstrateSource = new MemoryAgentSubstrateSource({ atespaces: ATESPACES, ...fleet });
      return (await readyFleet(createCaller(mockContext))).needsAttention;
    }

    function crashed(name: string, crashTime: string | null, message = "sandbox exited with code 137"): SubstrateActor {
      return { ...actor(name, "crashed"), crash: { message, crashTime } };
    }

    const MINUTE = 60_000;

    /** Snapshot generations 1, 2, … in the order of `durableStates`. */
    function withSnapshots(
      base: SubstrateActor,
      updatedMinutesAgo: number,
      durableStates: SnapshotDurableState[]
    ): SubstrateActor {
      return {
        ...base,
        updateTime: new Date(START.getTime() - updatedMinutesAgo * MINUTE).toISOString(),
        snapshots: durableStates.map((durableState, index) => ({
          uuid: `${base.name}-snap-${index + 1}`,
          generation: index + 1,
          fidelity: "memory",
          locality: "krci-control-plane",
          durableState,
        })),
      };
    }

    it("gives a crashed actor as an error with its crash message, crash time, issue and agent profile", async () => {
      vi.stubEnv("DEFAULT_CLUSTER_NAMESPACE", PLATFORM_NAMESPACE);
      stubK8s({ codebases: [codebase("go-app", "/krci/test-go-app")], gitServers: GITLAB });

      const items = await needsAttentionOf({
        actors: [crashed("issue-2-25", "2026-11-22T09:40:00.000Z", "out of memory"), actor("issue-2-26", "running")],
        actorTemplates: [
          issueTemplate("issue-2-25", "krci/test-go-app", "2", "25"),
          issueTemplate("issue-2-26", "krci/test-go-app", "2", "26"),
        ],
      });

      expect(items).toEqual([
        {
          kind: "actorCrashed",
          severity: "error",
          atespace: ATESPACE,
          name: "issue-2-25",
          message: "out of memory",
          crashedAt: "2026-11-22T09:40:00.000Z",
          agent: {
            issue: {
              projectPath: "krci/test-go-app",
              projectId: "2",
              iid: "25",
              url: "https://gitlab.example.com/krci/test-go-app/-/issues/25",
            },
            agentProfile: "go",
          },
        },
      ]);
    });

    it("gives a crashed actor that the dispatcher did not make no agent", async () => {
      const items = await needsAttentionOf({
        actors: [crashed("debug-shell", null)],
        actorTemplates: [plainTemplate("debug-shell")],
      });

      expect(items).toEqual([expect.objectContaining({ kind: "actorCrashed", name: "debug-shell", agent: null })]);
    });

    it("gives no item when actors, workers and worker pools are healthy", async () => {
      stubK8s({ workerPools: { [ATESPACE]: [workerPool(ATESPACE, "workers", { replicas: 2, readyReplicas: 2 })] } });

      const items = await needsAttentionOf({
        actors: [
          withSnapshots(actor("issue-2-25", "suspended"), 60, ["completed"]),
          withSnapshots(actor("issue-2-26", "running"), 60, []),
        ],
        actorTemplates: [
          issueTemplate("issue-2-25", "krci/test-go-app", "2", "25"),
          issueTemplate("issue-2-26", "krci/test-go-app", "2", "26"),
        ],
        workers: [worker("w1", "active"), worker("w2", "active")],
      });

      expect(items).toEqual([]);
    });

    it("gives a worker pool with fewer ready replicas than desired as an error", async () => {
      stubK8s({
        workerPools: {
          [ATESPACE]: [
            workerPool(ATESPACE, "workers", { replicas: 2, readyReplicas: 2 }),
            workerPool(ATESPACE, "spare", { replicas: 3, readyReplicas: 1 }),
          ],
        },
      });

      const items = await needsAttentionOf({ workers: [worker("w1", "active"), worker("w2", "active")] });

      expect(items).toEqual([
        {
          kind: "workerPoolNotReady",
          severity: "error",
          namespace: ATESPACE,
          name: "spare",
          desiredReplicas: 3,
          readyReplicas: 1,
        },
      ]);
    });

    it("gives the worker pool item of a readable namespace while the WorkerPool list is denied in another", async () => {
      stubK8s({
        workerPools: { "ns-1": [workerPool("ns-1", "a", { replicas: 2, readyReplicas: 0 })], "ns-2": forbidden() },
      });

      const items = await needsAttentionOf({
        workers: [
          worker("w1", "active", { workerPool: "a", workerNamespace: "ns-1" }),
          worker("w2", "active", { workerPool: "b", workerNamespace: "ns-2" }),
        ],
      });

      expect(items).toEqual([
        {
          kind: "workerPoolNotReady",
          severity: "error",
          namespace: "ns-1",
          name: "a",
          desiredReplicas: 2,
          readyReplicas: 0,
        },
      ]);
    });

    it("gives no worker pool item while the WorkerPool list is denied in every namespace", async () => {
      stubK8s({ workerPools: { [ATESPACE]: forbidden(), "ns-2": forbidden() } });

      const items = await needsAttentionOf({
        workers: [
          worker("w1", "active", { workerPool: "workers", workerNamespace: ATESPACE }),
          worker("w2", "active", { workerPool: "b", workerNamespace: "ns-2" }),
        ],
      });

      expect(items).toEqual([]);
    });

    it("gives an unavailable or unknown worker as an error and a draining worker as a warning, with its worker pool", async () => {
      const items = await needsAttentionOf({
        workers: [
          worker("w-active", "active"),
          worker("w-draining", "draining", { workerPool: "edge", workerNamespace: "ns-edge" }),
          worker("w-unavailable", "unavailable"),
          worker("w-unknown", "unknown"),
        ],
      });

      expect(items).toEqual([
        {
          kind: "workerNotActive",
          severity: "error",
          name: "w-unavailable",
          state: "unavailable",
          workerPool: "workers",
          workerNamespace: ATESPACE,
        },
        {
          kind: "workerNotActive",
          severity: "error",
          name: "w-unknown",
          state: "unknown",
          workerPool: "workers",
          workerNamespace: ATESPACE,
        },
        {
          kind: "workerNotActive",
          severity: "warning",
          name: "w-draining",
          state: "draining",
          workerPool: "edge",
          workerNamespace: "ns-edge",
        },
      ]);
    });

    it("gives a pending latest snapshot of an actor last changed more than 15 minutes ago as a warning", async () => {
      const items = await needsAttentionOf({
        actors: [withSnapshots(actor("issue-2-25", "suspended"), 16, ["completed", "pending"])],
      });

      expect(items).toEqual([
        {
          kind: "snapshotPending",
          severity: "warning",
          atespace: ATESPACE,
          name: "issue-2-25",
          generation: 2,
          updatedAt: new Date(START.getTime() - 16 * MINUTE).toISOString(),
        },
      ]);
    });

    it.each([14, 15])(
      "gives no item for a pending snapshot of an actor last changed %i minutes ago",
      async (minutesAgo) => {
        const items = await needsAttentionOf({
          actors: [withSnapshots(actor("issue-2-25", "suspended"), minutesAgo, ["completed", "pending"])],
        });

        expect(items).toEqual([]);
      }
    );

    it("gives a pending snapshot of an actor whose last change does not parse, with no time, after the timed ones", async () => {
      const unparsable = { ...withSnapshots(actor("a-no-time", "suspended"), 0, ["pending"]), updateTime: "" };

      const items = await needsAttentionOf({
        actors: [unparsable, withSnapshots(actor("z-timed", "suspended"), 30, ["pending"])],
      });

      expect(items.map((item) => [item.kind, item.name])).toEqual([
        ["snapshotPending", "z-timed"],
        ["snapshotPending", "a-no-time"],
      ]);
      expect(items[1]).toEqual({
        kind: "snapshotPending",
        severity: "warning",
        atespace: ATESPACE,
        name: "a-no-time",
        generation: 1,
        updatedAt: null,
      });
    });

    it("gives no item when an older snapshot generation is pending and the latest is durable", async () => {
      const base = withSnapshots(actor("issue-2-25", "suspended"), 60, ["pending", "completed"]);

      const items = await needsAttentionOf({ actors: [{ ...base, snapshots: [...base.snapshots].reverse() }] });

      expect(items).toEqual([]);
    });

    it.each(["none", "unknown"] as const)("gives no item when the latest snapshot is %s", async (durableState) => {
      const items = await needsAttentionOf({
        actors: [withSnapshots(actor("issue-2-25", "suspended"), 60, ["completed", durableState])],
      });

      expect(items).toEqual([]);
    });

    it("orders errors before warnings, then by kind, then oldest first, with an item with no time last by name", async () => {
      stubK8s({ workerPools: { [ATESPACE]: [workerPool(ATESPACE, "workers", { replicas: 3, readyReplicas: 2 })] } });

      const items = await needsAttentionOf({
        actors: [
          crashed("crash-late", "2026-11-22T09:40:00.000Z"),
          withSnapshots(actor("pending-recent", "suspended"), 20, ["pending"]),
          crashed("crash-no-time", null),
          withSnapshots(actor("pending-old", "suspended"), 60, ["pending"]),
          crashed("crash-early", "2026-11-22T09:00:00.000Z"),
          crashed("crash-another-no-time", null),
        ],
        workers: [worker("w-b", "draining"), worker("w-unavailable", "unavailable"), worker("w-a", "draining")],
      });

      expect(items.map((item) => [item.severity, item.kind, item.name])).toEqual([
        ["error", "actorCrashed", "crash-early"],
        ["error", "actorCrashed", "crash-late"],
        ["error", "actorCrashed", "crash-another-no-time"],
        ["error", "actorCrashed", "crash-no-time"],
        ["error", "workerPoolNotReady", "workers"],
        ["error", "workerNotActive", "w-unavailable"],
        ["warning", "workerNotActive", "w-a"],
        ["warning", "workerNotActive", "w-b"],
        ["warning", "snapshotPending", "pending-old"],
        ["warning", "snapshotPending", "pending-recent"],
      ]);
    });
  });

  describe("worker pools and room", () => {
    function source(fleet: Partial<MemoryFleet>) {
      return new MemoryAgentSubstrateSource({ atespaces: ATESPACES, ...fleet });
    }

    async function workerPoolsOf(fleet: Partial<MemoryFleet>) {
      mockContext.agentSubstrateSource = source(fleet);
      return (await readyFleet(createCaller(mockContext))).workerPools;
    }

    it("counts room in the largest CPU and memory limits, bound by CPU on one worker and memory on another", async () => {
      const pools = await workerPoolsOf({
        actors: [actor("cpu-heavy", "suspended"), actor("memory-heavy", "running")],
        actorTemplates: [
          plainTemplate("cpu-heavy", { cpuMillicores: 2000, memoryBytes: GIB }),
          plainTemplate("memory-heavy", { cpuMillicores: 500, memoryBytes: 4 * GIB }),
        ],
        workers: [
          worker("w1", "active", { capacity: { cpuMillicores: 8000, memoryBytes: 64 * GIB, actors: 1000 } }),
          worker("w2", "active", { capacity: { cpuMillicores: 64000, memoryBytes: 12 * GIB, actors: 1000 } }),
        ],
      });

      expect(pools.roomSize).toEqual({ cpuMillicores: 2000, memoryBytes: 4 * GIB });
      expect(pools.items.map(({ name, room }) => [name, room])).toEqual([["workers", 4 + 3]]);
    });

    describe("the resource that limits room", () => {
      const limitedByOf = async (fleet: Partial<MemoryFleet>) =>
        (await workerPoolsOf(fleet)).items.map(({ name, room, limitedBy }) => [name, room, limitedBy]);

      it("gives cpu when free CPU fits the fewest actors", async () => {
        expect(
          await limitedByOf({
            actors: [actor("small", "suspended")],
            actorTemplates: [plainTemplate("small", { cpuMillicores: 1000, memoryBytes: GIB })],
            workers: [
              worker("w1", "active", {
                capacity: { cpuMillicores: 4000, memoryBytes: 8 * GIB, actors: 10 },
                allocated: { cpuMillicores: 1000, memoryBytes: GIB, actors: 1 },
              }),
            ],
          })
        ).toEqual([["workers", 3, ["cpu"]]]);
      });

      it("gives memory when free memory, runtime overhead included, fits the fewest actors", async () => {
        expect(
          await limitedByOf({
            actors: [actor("small", "suspended")],
            actorTemplates: [plainTemplate("small", { cpuMillicores: 500, memoryBytes: 2 * GIB })],
            workers: [
              worker("microvm", "active", {
                capacity: { cpuMillicores: 8000, memoryBytes: 8 * GIB, actors: 10 },
                actorOverhead: { memoryBytes: 4 * MIB, memoryBytesPerGib: 8 * MIB },
              }),
            ],
          })
        ).toEqual([["workers", 3, ["memory"]]]);
      });

      it("gives actors when the free actor capacity fits the fewest actors", async () => {
        expect(
          await limitedByOf({
            actors: [actor("small", "running")],
            actorTemplates: [plainTemplate("small", { cpuMillicores: 500, memoryBytes: GIB })],
            workers: [
              worker("w1", "active", {
                capacity: { cpuMillicores: 4000, memoryBytes: 8 * GIB, actors: 3 },
                allocated: { cpuMillicores: 500, memoryBytes: GIB, actors: 1 },
              }),
            ],
          })
        ).toEqual([["workers", 2, ["actors"]]]);
      });

      it("gives actors when no actor exists: room counts actors only", async () => {
        expect(
          await limitedByOf({
            workers: [
              worker("w1", "active", {
                capacity: { cpuMillicores: 1000, memoryBytes: GIB, actors: 10 },
                allocated: { cpuMillicores: 1000, memoryBytes: GIB, actors: 4 },
              }),
            ],
          })
        ).toEqual([["workers", 6, ["actors"]]]);
      });

      it("gives every resource that fits the same fewest actors", async () => {
        expect(
          await limitedByOf({
            actors: [actor("small", "suspended")],
            actorTemplates: [plainTemplate("small", { cpuMillicores: 1000, memoryBytes: 2 * GIB })],
            workers: [worker("w1", "active", { capacity: { cpuMillicores: 2000, memoryBytes: 4 * GIB, actors: 2 } })],
          })
        ).toEqual([["workers", 2, ["actors", "cpu", "memory"]]]);
      });

      it("gives each resource that bounds room on one of the workers", async () => {
        expect(
          await limitedByOf({
            actors: [actor("cpu-heavy", "suspended"), actor("memory-heavy", "running")],
            actorTemplates: [
              plainTemplate("cpu-heavy", { cpuMillicores: 2000, memoryBytes: GIB }),
              plainTemplate("memory-heavy", { cpuMillicores: 500, memoryBytes: 4 * GIB }),
            ],
            workers: [
              // CPU fits 4, memory 16.
              worker("w1", "active", { capacity: { cpuMillicores: 8000, memoryBytes: 64 * GIB, actors: 1000 } }),
              // CPU fits 32, memory 3.
              worker("w2", "active", { capacity: { cpuMillicores: 64000, memoryBytes: 12 * GIB, actors: 1000 } }),
            ],
          })
        ).toEqual([["workers", 4 + 3, ["cpu", "memory"]]]);
      });

      it("gives cpu at room zero when a worker has more CPU allocated than its capacity", async () => {
        expect(
          await limitedByOf({
            actors: [actor("memory-only", "suspended")],
            actorTemplates: [plainTemplate("memory-only", { cpuMillicores: 0, memoryBytes: GIB })],
            workers: [worker("over-cpu", "active", { allocated: { cpuMillicores: 5000, memoryBytes: 0, actors: 1 } })],
          })
        ).toEqual([["workers", 0, ["cpu"]]]);
      });

      it("gives no resource for a worker pool with no active, registered worker", async () => {
        expect(
          await limitedByOf({
            workers: [worker("draining", "draining"), worker("unregistered", "active", { registered: false })],
          })
        ).toEqual([["workers", 0, []]]);
      });
    });

    it("counts room in actors only when no actor has a template", async () => {
      const pools = await workerPoolsOf({
        workers: [
          worker("w1", "active", {
            capacity: { cpuMillicores: 1000, memoryBytes: GIB, actors: 10 },
            allocated: { cpuMillicores: 1000, memoryBytes: GIB, actors: 3 },
          }),
        ],
      });

      expect(pools.roomSize).toBeNull();
      expect(pools.items[0].room).toBe(7);
    });

    it("counts room in actors only when the templates set no limits", async () => {
      const pools = await workerPoolsOf({
        actors: [actor("unlimited", "suspended")],
        actorTemplates: [plainTemplate("unlimited", { cpuMillicores: 0, memoryBytes: 0 })],
        workers: [
          worker("w1", "active", {
            capacity: { cpuMillicores: 0, memoryBytes: 0, actors: 10 },
            allocated: { cpuMillicores: 0, memoryBytes: 0, actors: 2 },
          }),
        ],
      });

      expect(pools.roomSize).toBeNull();
      expect(pools.items[0].room).toBe(8);
    });

    it("counts room in actors only, runtime overhead aside, when the templates set no limits", async () => {
      const pools = await workerPoolsOf({
        actors: [actor("unlimited", "suspended")],
        actorTemplates: [plainTemplate("unlimited", { cpuMillicores: 0, memoryBytes: 0 })],
        workers: [
          worker("microvm", "active", {
            capacity: { cpuMillicores: 0, memoryBytes: 0, actors: 10 },
            actorOverhead: { memoryBytes: 4 * MIB, memoryBytesPerGib: 8 * MIB },
          }),
        ],
      });

      expect(pools.roomSize).toBeNull();
      expect(pools.items[0].room).toBe(10);
    });

    it("adds no room for a worker over-allocated in a dimension that the room size does not limit", async () => {
      const pools = await workerPoolsOf({
        actors: [actor("memory-only", "suspended")],
        actorTemplates: [plainTemplate("memory-only", { cpuMillicores: 0, memoryBytes: GIB })],
        workers: [
          worker("over-cpu", "active", { allocated: { cpuMillicores: 5000, memoryBytes: 0, actors: 1 } }),
          worker("within", "active"),
        ],
      });

      expect(pools.items[0].room).toBe(8);
    });

    it("leaves an actor whose template is gone out of the room size", async () => {
      const pools = await workerPoolsOf({
        actors: [actor("small", "suspended"), actor("gone", "suspended")],
        actorTemplates: [plainTemplate("small")],
        workers: [worker("w1", "active")],
      });

      expect(pools.roomSize).toEqual({ cpuMillicores: 500, memoryBytes: GIB });
      expect(pools.items[0].room).toBe(8);
    });

    it("adds no room for a draining, unavailable, unknown or unregistered worker", async () => {
      const pools = await workerPoolsOf({
        actors: [actor("small", "suspended")],
        actorTemplates: [plainTemplate("small")],
        workers: [
          worker("active", "active"),
          worker("draining", "draining"),
          worker("unavailable", "unavailable"),
          worker("unknown", "unknown"),
          worker("unregistered", "active", { registered: false }),
        ],
      });

      expect(pools.items[0].room).toBe(8);
      expect(pools.items[0].capacity).toEqual({ cpuMillicores: 5 * 4000, memoryBytes: 5 * 8 * GIB, actors: 5 * 1000 });
    });

    it("adds no room for a worker at its actor capacity or with more allocated than its capacity", async () => {
      const pools = await workerPoolsOf({
        actors: [actor("small", "suspended")],
        actorTemplates: [plainTemplate("small")],
        workers: [
          worker("at-actor-capacity", "active", {
            capacity: { cpuMillicores: 4000, memoryBytes: 8 * GIB, actors: 2 },
            allocated: { cpuMillicores: 0, memoryBytes: 0, actors: 2 },
          }),
          worker("over-allocated", "active", {
            allocated: { cpuMillicores: 5000, memoryBytes: 9 * GIB, actors: 1 },
          }),
        ],
      });

      expect(pools.items[0].room).toBe(0);
    });

    it("books the runtime overhead of the worker on top of the memory limit", async () => {
      const pools = await workerPoolsOf({
        actors: [actor("issue-2-25", "suspended")],
        actorTemplates: [issueTemplate("issue-2-25", "krci/test-go-app", "2", "25")],
        workers: [
          worker("microvm", "active", {
            capacity: { cpuMillicores: 8000, memoryBytes: 2 * 2 * GIB, actors: 1000 },
            sandboxClasses: ["microvm"],
            actorOverhead: { memoryBytes: 4 * MIB, memoryBytesPerGib: 8 * MIB },
          }),
        ],
      });

      expect(pools.items[0].room).toBe(1);
    });

    it("gives one row per worker pool with its workers by name, by namespace and then name", async () => {
      const pools = await workerPoolsOf({
        workers: [
          worker("w-b2", "active", { workerPool: "b", workerNamespace: "ns-2" }),
          worker("w-a1", "active", { workerPool: "a", workerNamespace: "ns-2" }),
          worker("w-z1", "active", { workerPool: "z", workerNamespace: "ns-1" }),
          worker("w-b1", "draining", {
            workerPool: "b",
            workerNamespace: "ns-2",
            allocated: { cpuMillicores: 1000, memoryBytes: GIB, actors: 1 },
          }),
        ],
      });

      expect(pools.items.map(({ namespace, name, workers }) => [namespace, name, workers])).toEqual([
        ["ns-1", "z", ["w-z1"]],
        ["ns-2", "a", ["w-a1"]],
        ["ns-2", "b", ["w-b1", "w-b2"]],
      ]);
      expect(pools.items[2]).toMatchObject({
        capacity: { cpuMillicores: 8000, memoryBytes: 16 * GIB, actors: 2000 },
        allocated: { cpuMillicores: 1000, memoryBytes: GIB, actors: 1 },
        room: 1000,
      });
    });

    it("lists WorkerPools in krci-agents when Agent Substrate has no worker", async () => {
      const { list } = stubK8s({
        workerPools: { "krci-agents": [workerPool("krci-agents", "workers", { replicas: 2, readyReplicas: 0 })] },
      });

      const pools = await workerPoolsOf({});

      expect(list.mock.calls.map(([config, namespace]) => [config, namespace])).toEqual([
        [k8sWorkerPoolConfig, "krci-agents"],
      ]);
      expect(pools.items).toEqual([
        expect.objectContaining({
          namespace: "krci-agents",
          name: "workers",
          workers: [],
          room: 0,
          resource: expect.objectContaining({ desiredReplicas: 2, readyReplicas: 0 }),
        }),
      ]);
    });

    it("adds the WorkerPool replicas, sandbox class and resolution to the row of its name", async () => {
      const { list } = stubK8s({
        workerPools: { [ATESPACE]: [workerPool(ATESPACE, "workers", { replicas: 2, readyReplicas: 1 })] },
      });

      const pools = await workerPoolsOf({ workers: [worker("w1", "active")] });

      expect(list).toHaveBeenCalledTimes(1);
      expect(list.mock.calls[0].slice(0, 2)).toEqual([k8sWorkerPoolConfig, ATESPACE]);
      expect(pools.access).toBe("ok");
      expect(pools.items).toEqual([
        {
          name: "workers",
          namespace: ATESPACE,
          workers: ["w1"],
          capacity: { cpuMillicores: 4000, memoryBytes: 8 * GIB, actors: 1000 },
          allocated: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
          room: 1000,
          limitedBy: ["actors"],
          resource: { desiredReplicas: 2, readyReplicas: 1, sandboxClass: "gvisor", resolution: "Resolved" },
        },
      ]);
    });

    it("gives a WorkerPool with no worker a row with zero capacity and no room", async () => {
      stubK8s({
        workerPools: {
          [ATESPACE]: [
            workerPool(ATESPACE, "workers"),
            workerPool(ATESPACE, "spare", { replicas: 2, readyReplicas: 0, resolution: null }),
          ],
        },
      });

      const pools = await workerPoolsOf({ workers: [worker("w1", "active")] });

      expect(pools.items.map(({ name }) => name)).toEqual(["spare", "workers"]);
      expect(pools.items[0]).toEqual({
        name: "spare",
        namespace: ATESPACE,
        workers: [],
        capacity: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
        allocated: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
        room: 0,
        limitedBy: [],
        resource: { desiredReplicas: 2, readyReplicas: 0, sandboxClass: "gvisor", resolution: null },
      });
    });

    it("keeps capacity and room but no WorkerPool fields when the WorkerPool list is denied, and logs nothing", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      stubK8s({ workerPools: { [ATESPACE]: forbidden() } });

      const pools = await workerPoolsOf({ workers: [worker("w1", "active")] });

      expect(pools.access).toBe("denied");
      expect(pools.items).toEqual([expect.objectContaining({ name: "workers", room: 1000, resource: null })]);
      expect(warn).not.toHaveBeenCalled();
    });

    it("reports error and logs a WorkerPool list failure other than 403, with capacity and room kept", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const outage = new K8sApiError(500, "Internal Server Error", "");
      stubK8s({ workerPools: { [ATESPACE]: outage } });

      const pools = await workerPoolsOf({ workers: [worker("w1", "active")] });

      expect(pools.access).toBe("error");
      expect(pools.items).toEqual([expect.objectContaining({ name: "workers", room: 1000, resource: null })]);
      expect(warn).toHaveBeenCalledWith(`[AgentSubstrate] WorkerPool list in namespace ${ATESPACE} failed:`, outage);
    });

    it("reports denied when one namespace is denied and keeps the WorkerPool fields of the readable one", async () => {
      const { list } = stubK8s({ workerPools: { "ns-1": [workerPool("ns-1", "a")], "ns-2": forbidden() } });

      const pools = await workerPoolsOf({
        workers: [
          worker("w1", "active", { workerPool: "a", workerNamespace: "ns-1" }),
          worker("w2", "active", { workerPool: "b", workerNamespace: "ns-2" }),
          worker("w3", "active", { workerPool: "b", workerNamespace: "ns-2" }),
        ],
      });

      expect(listedNamespaces(list, k8sWorkerPoolConfig)).toEqual(["krci-agents", "ns-1", "ns-2"]);
      expect(pools.access).toBe("denied");
      expect(pools.items.map(({ namespace, resource }) => [namespace, resource?.desiredReplicas ?? null])).toEqual([
        ["ns-1", 1],
        ["ns-2", null],
      ]);
    });

    it("reports error with no WorkerPool list when the K8s client cannot be set up", async () => {
      const { list } = stubK8s({ workerPools: { [ATESPACE]: [workerPool(ATESPACE, "workers")] } });
      mockContext.session.user!.secret.idToken = "";

      const pools = await workerPoolsOf({ workers: [worker("w1", "active")] });

      expect(list).not.toHaveBeenCalled();
      expect(pools.access).toBe("error");
      expect(pools.items).toEqual([expect.objectContaining({ name: "workers", room: 1000, resource: null })]);
    });

    it("reports error over denied when one namespace fails and another is denied", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      stubK8s({ workerPools: { "ns-1": new Error("socket hang up"), "ns-2": forbidden() } });

      const pools = await workerPoolsOf({
        workers: [
          worker("w1", "active", { workerPool: "a", workerNamespace: "ns-1" }),
          worker("w2", "active", { workerPool: "b", workerNamespace: "ns-2" }),
        ],
      });

      expect(pools.access).toBe("error");
    });

    it("gives the fleet with WorkerPool access error when the WorkerPool list does not answer in time", async () => {
      vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
      vi.setSystemTime(START);
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(K8sClient.prototype, "listResource").mockImplementation(() => new Promise(() => {}));
      mockContext.agentSubstrateSource = source({ workers: [worker("w1", "active")] });

      const pending = readyFleet(createCaller(mockContext));
      await vi.advanceTimersByTimeAsync(5_000);
      const fleet = await pending;

      expect(fleet.workerPools.access).toBe("error");
      expect(fleet.workerPools.items).toEqual([
        expect.objectContaining({ name: "workers", room: 1000, resource: null }),
      ]);
      expect(warn).toHaveBeenCalledWith("[AgentSubstrate] WorkerPool list timed out after 5000 ms");
    });

    it("treats a 404 WorkerPool list as no WorkerPool, quietly", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      stubK8s({ workerPools: { [ATESPACE]: new K8sApiError(404, "Not Found", "") } });

      const pools = await workerPoolsOf({ workers: [worker("w1", "active")] });

      expect(pools.access).toBe("ok");
      expect(pools.items).toEqual([expect.objectContaining({ name: "workers", resource: null })]);
      expect(warn).not.toHaveBeenCalled();
    });

    it("lists no WorkerPools cluster-wide for a worker that names no namespace", async () => {
      const { list } = stubK8s({ workerPools: { [ATESPACE]: [workerPool(ATESPACE, "workers")] } });

      const pools = await workerPoolsOf({
        workers: [worker("w1", "active"), worker("w2", "active", { workerPool: "", workerNamespace: "" })],
      });

      expect(list.mock.calls.map(([config, namespace]) => [config, namespace])).toEqual([
        [k8sWorkerPoolConfig, ATESPACE],
      ]);
      expect(pools.access).toBe("ok");
    });

    it("keeps listing a worker namespace after its last worker is gone", async () => {
      const source = new MemoryAgentSubstrateSource({
        atespaces: ATESPACES,
        workers: [worker("w1", "active", { workerPool: "edge", workerNamespace: "ns-edge" })],
      });
      mockContext.agentSubstrateSource = source;
      stubK8s({ workerPools: { "ns-edge": [workerPool("ns-edge", "edge", { replicas: 2, readyReplicas: 0 })] } });
      const caller = createCaller(mockContext);

      await readyFleet(caller);
      source.setFleet({ workers: [] });
      vi.setSystemTime(START.getTime() + 5_000);
      const later = await readyFleet(caller);

      expect(later.workerPools.items).toEqual([
        expect.objectContaining({
          namespace: "ns-edge",
          name: "edge",
          workers: [],
          room: 0,
          resource: expect.objectContaining({ desiredReplicas: 2, readyReplicas: 0 }),
        }),
      ]);
    });

    it("passes on whether a worker is registered", async () => {
      mockContext.agentSubstrateSource = source({
        workers: [worker("registered", "active"), worker("unregistered", "active", { registered: false })],
      });

      const fleet = await readyFleet(createCaller(mockContext));

      expect(fleet.workers.map(({ name, registered }) => [name, registered])).toEqual([
        ["registered", true],
        ["unregistered", false],
      ]);
    });
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
      // The recorder runs with no session: the WorkerPool list gives `error`.
      vi.spyOn(console, "warn").mockImplementation(() => {});
      stubK8s({ workerPools: { [ATESPACE]: new Error("no session") } });
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
