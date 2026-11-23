import { readFileSync } from "node:fs";
import path from "node:path";
import {
  K8sApiError,
  k8sCodebaseConfig,
  k8sGitServerConfig,
  type ActorState,
  type K8sResourceConfig,
  type ReadyFleetSnapshot,
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

/** Answers Codebase list and GitServer reads in PLATFORM_NAMESPACE only. Anything not given answers 403. */
function stubK8s({
  codebases,
  gitServers = {},
}: {
  codebases?: unknown[] | Error;
  gitServers?: Record<string, unknown>;
}) {
  const forbidden = () => new K8sApiError(403, "Forbidden", "");
  const list = vi
    .spyOn(K8sClient.prototype, "listResource")
    .mockImplementation(async (config: K8sResourceConfig, namespace?: string) => {
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

      expect(new Set(list.mock.calls.map(([, namespace]) => namespace))).toEqual(new Set([PLATFORM_NAMESPACE]));
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

      expect(list).not.toHaveBeenCalled();
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

      expect(list).not.toHaveBeenCalled();
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
