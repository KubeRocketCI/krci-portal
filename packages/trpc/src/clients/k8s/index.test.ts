import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { KubeConfig } from "@kubernetes/client-node";
import { K8sClient } from ".";
import { CustomSession } from "../../context/types";

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
    KubeConfig: vi.fn().mockImplementation(() => mockKubeConfig as KubeConfig),
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

  it("throws error if no idToken is provided", () => {
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

    expect(() => new K8sClient(sessionWithoutToken)).toThrow("No access token provided in session");
  });

  it("throws error if current cluster is not found", () => {
    vi.mocked(KubeConfig).mockImplementationOnce(
      () =>
        ({
          loadFromDefault: vi.fn(),
          loadFromCluster: vi.fn(),
          getCurrentCluster: vi.fn().mockReturnValue(undefined),
          getCurrentContext: vi.fn().mockReturnValue("test-context"),
          setCurrentContext: vi.fn(),
          users: [],
          contexts: [],
          clusters: [],
          currentContext: "test-context",
        }) as unknown as KubeConfig
    );

    expect(() => new K8sClient(validSession)).toThrow("No cluster configuration found");
  });

  it("throws error if current context is not found", () => {
    vi.mocked(KubeConfig).mockImplementationOnce(
      () =>
        ({
          loadFromDefault: vi.fn(),
          loadFromCluster: vi.fn(),
          getCurrentCluster: vi.fn().mockReturnValue({ name: "test-cluster" }),
          getCurrentContext: vi.fn().mockReturnValue(undefined),
          setCurrentContext: vi.fn(),
          users: [],
          contexts: [],
          clusters: [],
          currentContext: undefined,
        }) as unknown as KubeConfig
    );

    expect(() => new K8sClient(validSession)).toThrow("No current context found in kubeConfig");
  });
});
