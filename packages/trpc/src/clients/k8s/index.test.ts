import { describe, it, beforeEach, afterEach, expect, vi, Mock } from "vitest";
import { KubeConfig } from "@kubernetes/client-node";
import { K8sApiError } from "@my-project/shared";
import fetchModule from "node-fetch";
import { K8sClient } from "./index.js";
import { CustomSession } from "../../context/types.js";

vi.mock("node-fetch", () => ({ default: vi.fn() }));

vi.mock("@kubernetes/client-node", () => {
  const mockKubeConfig: Partial<KubeConfig> = {
    loadFromDefault: vi.fn(),
    loadFromCluster: vi.fn(),
    getCurrentCluster: vi.fn().mockReturnValue({ name: "test-cluster" }),
    getCurrentContext: vi.fn().mockReturnValue("test-context"),
    setCurrentContext: vi.fn(),
    users: [],
    contexts: [],
    clusters: [], // Required by KubeConfig type
    currentContext: "test-context", // Required by KubeConfig type
  };

  return {
    KubeConfig: vi.fn(function () {
      return mockKubeConfig as KubeConfig;
    }),
  };
});

describe("K8sClient", () => {
  const validSession = {
    login: undefined,
    user: {
      data: {
        email: "test@example.com",
        email_verified: true,
        family_name: "Doe",
        given_name: "John",
        name: "John Doe",
        preferred_username: "johndoe",
        sub: "user123",
      },
      secret: {
        idToken: "test-id-token",
        idTokenExpiresAt: Date.now() + 10000,
        accessToken: "test-access-token",
        accessTokenExpiresAt: Date.now() + 10000,
        refreshToken: "refresh",
      },
    },
  } as CustomSession;

  beforeEach(() => {
    process.env.NODE_ENV = "development";
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("initializes kubeconfig with correct user and context", () => {
    const client = new K8sClient(validSession);
    const kc = client.KubeConfig!;

    expect(kc.loadFromDefault).toHaveBeenCalled();
    expect(kc.users).toEqual([
      {
        name: "test@example.com",
        token: "test-id-token",
      },
    ]);
    expect(kc.contexts).toEqual([
      {
        name: "test-context",
        cluster: "test-cluster",
        user: "test@example.com",
      },
    ]);
    expect(kc.setCurrentContext).toHaveBeenCalledWith("test-context");
  });

  it("loads from cluster in production environment", () => {
    process.env.NODE_ENV = "production";
    const client = new K8sClient(validSession);
    const kc = client.KubeConfig!;

    expect(kc.loadFromCluster).toHaveBeenCalled();
    expect(kc.loadFromDefault).not.toHaveBeenCalled();
  });

  it("uses default user name when email is missing", () => {
    const sessionWithoutEmail = {
      login: undefined,
      user: {
        data: {
          email: "",
          email_verified: true,
          family_name: "Doe",
          given_name: "John",
          name: "John Doe",
          preferred_username: "johndoe",
          sub: "user123",
        },
        secret: {
          idToken: "test-id-token",
          idTokenExpiresAt: Date.now() + 10000,
          accessToken: "test-access-token",
          accessTokenExpiresAt: Date.now() + 10000,
          refreshToken: "refresh",
        },
      },
    } as CustomSession;

    const client = new K8sClient(sessionWithoutEmail);
    const kc = client.KubeConfig!;

    expect(kc.users).toEqual([
      {
        name: "oidc-user",
        token: "test-id-token",
      },
    ]);
    expect(kc.contexts).toEqual([
      {
        name: "test-context",
        cluster: "test-cluster",
        user: "oidc-user",
      },
    ]);
  });

  it("leaves KubeConfig null when no idToken is provided (no throw)", () => {
    // Mirrors the no-session branch so getInitializedK8sClient can raise a single
    // typed UNAUTHORIZED error at the call site instead of a bare Error bubbling up.
    const sessionWithoutToken = {
      login: undefined,
      user: {
        data: {
          email: "test@example.com",
          email_verified: true,
          family_name: "Doe",
          given_name: "John",
          name: "John Doe",
          preferred_username: "johndoe",
          sub: "user123",
        },
        secret: {
          idToken: "",
          idTokenExpiresAt: 0,
          accessToken: "",
          accessTokenExpiresAt: 0,
          refreshToken: "",
        },
      },
    } as CustomSession;

    const client = new K8sClient(sessionWithoutToken);
    expect(client.KubeConfig).toBeNull();
  });

  it("leaves KubeConfig null if current cluster is not found", () => {
    // Mirrors the no-token branch: a misconfigured kubeconfig produces a null
    // KubeConfig so getInitializedK8sClient can raise a typed UNAUTHORIZED
    // TRPCError, instead of throwing a bare Error that handleK8sError maps to 500.
    vi.mocked(KubeConfig).mockImplementationOnce(function () {
      return {
        loadFromDefault: vi.fn(),
        loadFromCluster: vi.fn(),
        getCurrentCluster: vi.fn().mockReturnValue(undefined),
        getCurrentContext: vi.fn().mockReturnValue("test-context"),
        setCurrentContext: vi.fn(),
        users: [],
        contexts: [],
        clusters: [],
        currentContext: "test-context",
      } as unknown as KubeConfig;
    });

    const client = new K8sClient(validSession);
    expect(client.KubeConfig).toBeNull();
  });

  describe("discoverResource", () => {
    it("discovers a core v1 resource", async () => {
      const client = new K8sClient(validSession);
      (vi.spyOn(client, "fetchApiPath" as never) as unknown as Mock).mockResolvedValue({
        resources: [
          { name: "configmaps", namespaced: true, kind: "ConfigMap" },
          { name: "configmaps/status", namespaced: true, kind: "ConfigMap" },
        ],
      } as never);

      const result = await client.discoverResource("v1", "ConfigMap");

      expect(result).toEqual({ pluralName: "configmaps", namespaced: true });
    });

    it("discovers an API group resource", async () => {
      const client = new K8sClient(validSession);
      (vi.spyOn(client, "fetchApiPath" as never) as unknown as Mock).mockResolvedValue({
        resources: [{ name: "deployments", namespaced: true, kind: "Deployment" }],
      } as never);

      const result = await client.discoverResource("apps/v1", "Deployment");

      expect(result).toEqual({ pluralName: "deployments", namespaced: true });
    });

    it("excludes subresources (paths containing /)", async () => {
      const client = new K8sClient(validSession);
      (vi.spyOn(client, "fetchApiPath" as never) as unknown as Mock).mockResolvedValue({
        resources: [
          { name: "pods/log", namespaced: true, kind: "Pod" },
          { name: "pods", namespaced: true, kind: "Pod" },
        ],
      } as never);

      const result = await client.discoverResource("v1", "Pod");

      expect(result.pluralName).toBe("pods");
    });

    it("throws when resource kind is not found", async () => {
      const client = new K8sClient(validSession);
      (vi.spyOn(client, "fetchApiPath" as never) as unknown as Mock).mockResolvedValue({ resources: [] } as never);

      await expect(client.discoverResource("v1", "Unknown")).rejects.toThrow(
        'Resource kind "Unknown" not found in apiVersion "v1"'
      );
    });
  });

  it("leaves KubeConfig null if current context is not found", () => {
    vi.mocked(KubeConfig).mockImplementationOnce(function () {
      return {
        loadFromDefault: vi.fn(),
        loadFromCluster: vi.fn(),
        getCurrentCluster: vi.fn().mockReturnValue({ name: "test-cluster" }),
        getCurrentContext: vi.fn().mockReturnValue(undefined),
        setCurrentContext: vi.fn(),
        users: [],
        contexts: [],
        clusters: [],
        currentContext: undefined,
      } as unknown as KubeConfig;
    });

    const client = new K8sClient(validSession);
    expect(client.KubeConfig).toBeNull();
  });

  describe("patchResource — patchType + subresource", () => {
    const deployConfig = {
      group: "apps",
      version: "v1",
      apiVersion: "apps/v1",
      kind: "Deployment",
      singularName: "deployment",
      pluralName: "deployments",
    };

    const makeKubeConfigWithServer = function () {
      return {
        loadFromDefault: vi.fn(),
        loadFromCluster: vi.fn(),
        getCurrentCluster: vi.fn().mockReturnValue({ name: "test-cluster", server: "https://k8s.example.com" }),
        getCurrentContext: vi.fn().mockReturnValue("test-context"),
        getCurrentUser: vi.fn().mockReturnValue({}),
        setCurrentContext: vi.fn(),
        applyToHTTPSOptions: vi.fn(),
        users: [],
        contexts: [],
        clusters: [],
        currentContext: "test-context",
      } as unknown as KubeConfig;
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("default patchType sends Content-Type application/strategic-merge-patch+json", async () => {
      vi.mocked(KubeConfig).mockImplementationOnce(makeKubeConfigWithServer);
      const fetchMock = vi.mocked(fetchModule);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      } as never);

      const client = new K8sClient(validSession);
      await client.patchResource(deployConfig, "foo", "ns", { spec: { replicas: 3 } });

      const call0 = fetchMock.mock.calls[0]!;
      expect(call0[1]!.method).toBe("PATCH");
      expect((call0[1]!.headers as Record<string, string>)["Content-Type"]).toBe(
        "application/strategic-merge-patch+json"
      );
    });

    it('patchType "merge" sends Content-Type application/merge-patch+json', async () => {
      vi.mocked(KubeConfig).mockImplementationOnce(makeKubeConfigWithServer);
      const fetchMock = vi.mocked(fetchModule);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      } as never);

      const client = new K8sClient(validSession);
      await client.patchResource(deployConfig, "foo", "ns", {}, "merge");

      const call0 = fetchMock.mock.calls[0]!;
      expect((call0[1]!.headers as Record<string, string>)["Content-Type"]).toBe("application/merge-patch+json");
    });

    it('patchType "json" sends Content-Type application/json-patch+json', async () => {
      vi.mocked(KubeConfig).mockImplementationOnce(makeKubeConfigWithServer);
      const fetchMock = vi.mocked(fetchModule);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      } as never);

      const client = new K8sClient(validSession);
      await client.patchResource(deployConfig, "foo", "ns", [], "json");

      const call0 = fetchMock.mock.calls[0]!;
      expect((call0[1]!.headers as Record<string, string>)["Content-Type"]).toBe("application/json-patch+json");
    });

    it('subresource "scale" appends /scale to the URL', async () => {
      vi.mocked(KubeConfig).mockImplementationOnce(makeKubeConfigWithServer);
      const fetchMock = vi.mocked(fetchModule);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      } as never);

      const client = new K8sClient(validSession);
      await client.patchResource(deployConfig, "foo", "ns", { spec: { replicas: 5 } }, "strategic", "scale");

      expect(fetchMock.mock.calls[0][0] as string).toMatch(
        /\/apis\/apps\/v1\/namespaces\/ns\/deployments\/foo\/scale$/
      );
    });

    it('subresource "status" appends /status to the URL', async () => {
      vi.mocked(KubeConfig).mockImplementationOnce(makeKubeConfigWithServer);
      const fetchMock = vi.mocked(fetchModule);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      } as never);

      const client = new K8sClient(validSession);
      await client.patchResource(deployConfig, "foo", "ns", { status: {} }, "merge", "status");

      expect(fetchMock.mock.calls[0][0] as string).toMatch(
        /\/apis\/apps\/v1\/namespaces\/ns\/deployments\/foo\/status$/
      );
    });

    it("throws K8sApiError on non-2xx PATCH response", async () => {
      vi.mocked(KubeConfig).mockImplementationOnce(makeKubeConfigWithServer);
      const fetchMock = vi.mocked(fetchModule);
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: "Conflict",
        text: async () => '{"message":"object has been modified"}',
      } as never);

      const client = new K8sClient(validSession);
      await expect(
        client.patchResource(deployConfig, "foo", "ns", { spec: { replicas: 2 } }, "strategic", "scale")
      ).rejects.toMatchObject({
        name: "K8sApiError",
        statusCode: 409,
        statusText: "Conflict",
      });
    });

    it("throws K8sApiError instance (not a plain Error) on PATCH failure", async () => {
      vi.mocked(KubeConfig).mockImplementationOnce(makeKubeConfigWithServer);
      const fetchMock = vi.mocked(fetchModule);
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () => "{}",
      } as never);

      const client = new K8sClient(validSession);
      await expect(client.patchResource(deployConfig, "foo", "ns", {})).rejects.toBeInstanceOf(K8sApiError);
    });
  });

  describe("listAllResources — continue-token pagination", () => {
    const rsConfig = {
      group: "apps",
      version: "v1",
      apiVersion: "apps/v1",
      kind: "ReplicaSet",
      singularName: "replicaset",
      pluralName: "replicasets",
    };

    const makeKubeConfigWithServer = function () {
      return {
        loadFromDefault: vi.fn(),
        loadFromCluster: vi.fn(),
        getCurrentCluster: vi.fn().mockReturnValue({ name: "test-cluster", server: "https://k8s.example.com" }),
        getCurrentContext: vi.fn().mockReturnValue("test-context"),
        getCurrentUser: vi.fn().mockReturnValue({}),
        setCurrentContext: vi.fn(),
        applyToHTTPSOptions: vi.fn(),
        users: [],
        contexts: [],
        clusters: [],
        currentContext: "test-context",
      } as unknown as KubeConfig;
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("follows the continue token until the API server stops returning one", async () => {
      vi.mocked(KubeConfig).mockImplementationOnce(makeKubeConfigWithServer);
      const fetchMock = vi.mocked(fetchModule);
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ items: [{ name: "a" }, { name: "b" }], metadata: { continue: "tok-1" } }),
        } as never)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ items: [{ name: "c" }], metadata: { continue: "tok-2" } }),
        } as never)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ items: [{ name: "d" }], metadata: {} }),
        } as never);

      const client = new K8sClient(validSession);
      const result = await client.listAllResources(rsConfig, "ns");

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result.items).toHaveLength(4);
      expect(result.items.map((it) => (it as unknown as { name: string }).name)).toEqual(["a", "b", "c", "d"]);
      const secondCallUrl = fetchMock.mock.calls[1]![0] as string;
      expect(secondCallUrl).toContain("continue=tok-1");
      const thirdCallUrl = fetchMock.mock.calls[2]![0] as string;
      expect(thirdCallUrl).toContain("continue=tok-2");
    });

    it("forwards labelSelector on every page", async () => {
      vi.mocked(KubeConfig).mockImplementationOnce(makeKubeConfigWithServer);
      const fetchMock = vi.mocked(fetchModule);
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ items: [], metadata: { continue: "tok" } }),
        } as never)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ items: [], metadata: {} }),
        } as never);

      const client = new K8sClient(validSession);
      await client.listAllResources(rsConfig, "ns", "app=foo");

      expect(fetchMock.mock.calls[0]![0] as string).toContain("labelSelector=app%3Dfoo");
      expect(fetchMock.mock.calls[1]![0] as string).toContain("labelSelector=app%3Dfoo");
    });

    it("returns an empty list without throwing when the API server returns items: null", async () => {
      // Some non-conformant API servers / alpha resources return null instead of [].
      vi.mocked(KubeConfig).mockImplementationOnce(makeKubeConfigWithServer);
      const fetchMock = vi.mocked(fetchModule);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ items: null, metadata: {} }),
      } as never);

      const client = new K8sClient(validSession);
      const result = await client.listAllResources(rsConfig, "ns");

      expect(result.items).toHaveLength(0);
    });

    it("caps at maxPages to prevent unbounded loops on a misbehaving server", async () => {
      vi.mocked(KubeConfig).mockImplementationOnce(makeKubeConfigWithServer);
      const fetchMock = vi.mocked(fetchModule);
      fetchMock.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ items: [{ name: "x" }], metadata: { continue: "never-ends" } }),
      } as never);

      const client = new K8sClient(validSession);
      const result = await client.listAllResources(rsConfig, "ns", undefined, { maxPages: 3 });

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result.items).toHaveLength(3);
    });
  });

  describe("fromToken", () => {
    it("builds a client carrying the token with the oidc-user fallback name", () => {
      const client = K8sClient.fromToken("sa-token");
      const kc = client.KubeConfig!;

      expect(kc).not.toBeNull();
      expect(kc.users).toEqual([{ name: "oidc-user", token: "sa-token" }]);
    });
  });

  describe("getSelfSubjectReview", () => {
    const makeKubeConfigWithServer = function () {
      return {
        loadFromDefault: vi.fn(),
        loadFromCluster: vi.fn(),
        getCurrentCluster: vi.fn().mockReturnValue({ name: "test-cluster", server: "https://k8s.example.com" }),
        getCurrentContext: vi.fn().mockReturnValue("test-context"),
        getCurrentUser: vi.fn().mockReturnValue({}),
        setCurrentContext: vi.fn(),
        applyToHTTPSOptions: vi.fn(),
        users: [],
        contexts: [],
        clusters: [],
        currentContext: "test-context",
      } as unknown as KubeConfig;
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("POSTs a SelfSubjectReview to the cluster and returns the parsed userInfo", async () => {
      vi.mocked(KubeConfig).mockImplementationOnce(makeKubeConfigWithServer);
      const fetchMock = vi.mocked(fetchModule);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          apiVersion: "authentication.k8s.io/v1",
          kind: "SelfSubjectReview",
          status: {
            userInfo: {
              username: "system:serviceaccount:edp:edp-admin",
              uid: "uid-1",
              groups: ["system:authenticated"],
            },
          },
        }),
      } as never);

      const client = K8sClient.fromToken("sa-token");
      const result = await client.getSelfSubjectReview();

      const call0 = fetchMock.mock.calls[0]!;
      expect(call0[0]).toBe("https://k8s.example.com/apis/authentication.k8s.io/v1/selfsubjectreviews");
      expect(call0[1]!.method).toBe("POST");
      expect(JSON.parse(call0[1]!.body as string)).toMatchObject({
        apiVersion: "authentication.k8s.io/v1",
        kind: "SelfSubjectReview",
      });
      expect(result.status?.userInfo?.username).toBe("system:serviceaccount:edp:edp-admin");
    });

    it("throws K8sApiError on a non-2xx response (e.g. 401)", async () => {
      vi.mocked(KubeConfig).mockImplementationOnce(makeKubeConfigWithServer);
      const fetchMock = vi.mocked(fetchModule);
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "{}",
      } as never);

      const client = K8sClient.fromToken("bad-token");

      await expect(client.getSelfSubjectReview()).rejects.toBeInstanceOf(K8sApiError);
    });
  });
});
