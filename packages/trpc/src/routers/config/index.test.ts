import { createMockedContext } from "../../__mocks__/context.js";
import { createCaller } from "../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("config.oidc", () => {
  it("should return oidcIssuerUrl and oidcEnabled from context", async () => {
    const mockContext = createMockedContext();
    const caller = createCaller(mockContext);

    const result = await caller.config.oidc();

    expect(result).toEqual({ oidcIssuerUrl: "https://mock-issuer.example.com", oidcEnabled: true });
  });

  it("reports oidcEnabled=false when no issuer URL is configured (SA-only mode)", async () => {
    const mockContext = createMockedContext();
    mockContext.oidcConfig.issuerURL = "";
    const caller = createCaller(mockContext);

    const result = await caller.config.oidc();

    expect(result).toEqual({ oidcIssuerUrl: "", oidcEnabled: false });
  });
});

describe("config.get", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return config from environment variables", async () => {
    process.env.DEFAULT_CLUSTER_NAME = "my-cluster";
    process.env.DEFAULT_CLUSTER_NAMESPACE = "default-ns";
    process.env.SONAR_WEB_URL = "https://sonar.example.com";
    process.env.DEPENDENCY_TRACK_WEB_URL = "https://dt.example.com";
    process.env.DEFECTDOJO_URL = "http://defectdojo.krci:8080";
    process.env.DEFECTDOJO_API_KEY = "key";
    process.env.DEFECTDOJO_WEB_URL = "https://dd.example.com";

    const mockContext = createMockedContext();
    const caller = createCaller(mockContext);

    const result = await caller.config.get();

    expect(result).toEqual({
      clusterName: "my-cluster",
      defaultNamespace: "default-ns",
      sonarWebUrl: "https://sonar.example.com",
      dependencyTrackWebUrl: "https://dt.example.com",
      defectDojoWebUrl: "https://dd.example.com",
    });
  });

  it("should fallback to empty string when env vars are missing", async () => {
    delete process.env.DEFAULT_CLUSTER_NAME;
    delete process.env.DEFAULT_CLUSTER_NAMESPACE;
    delete process.env.SONAR_WEB_URL;
    delete process.env.SONAR_HOST_URL;
    delete process.env.DEPENDENCY_TRACK_WEB_URL;
    delete process.env.DEPENDENCY_TRACK_URL;
    delete process.env.DEFECTDOJO_WEB_URL;
    delete process.env.DEFECTDOJO_URL;
    delete process.env.DEFECTDOJO_API_KEY;

    const mockContext = createMockedContext();
    const caller = createCaller(mockContext);

    const result = await caller.config.get();

    expect(result).toEqual({
      clusterName: "",
      defaultNamespace: "",
      sonarWebUrl: "",
      dependencyTrackWebUrl: "",
      defectDojoWebUrl: "",
    });
  });

  it("should use SONAR_HOST_URL when SONAR_WEB_URL is not set", async () => {
    delete process.env.SONAR_WEB_URL;
    process.env.SONAR_HOST_URL = "https://sonar-host.example.com";

    const mockContext = createMockedContext();
    const caller = createCaller(mockContext);

    const result = await caller.config.get();

    expect(result.sonarWebUrl).toBe("https://sonar-host.example.com");
  });

  it("should use DEPENDENCY_TRACK_URL when DEPENDENCY_TRACK_WEB_URL is not set", async () => {
    delete process.env.DEPENDENCY_TRACK_WEB_URL;
    process.env.DEPENDENCY_TRACK_URL = "https://dt-url.example.com";

    const mockContext = createMockedContext();
    const caller = createCaller(mockContext);

    const result = await caller.config.get();

    expect(result.dependencyTrackWebUrl).toBe("https://dt-url.example.com");
  });

  it.each([
    ["DEFECTDOJO_WEB_URL", { DEFECTDOJO_URL: "https://dd-api.example.com", DEFECTDOJO_API_KEY: "key" }],
    ["DEFECTDOJO_URL", { DEFECTDOJO_API_KEY: "key", DEFECTDOJO_WEB_URL: "https://dd.example.com" }],
    [
      "DEFECTDOJO_API_KEY",
      { DEFECTDOJO_URL: "https://dd-api.example.com", DEFECTDOJO_WEB_URL: "https://dd.example.com" },
    ],
  ])("should hide the DefectDojo link when %s is not set", async (_missing, env) => {
    delete process.env.DEFECTDOJO_URL;
    delete process.env.DEFECTDOJO_API_KEY;
    delete process.env.DEFECTDOJO_WEB_URL;
    Object.assign(process.env, env);

    const caller = createCaller(createMockedContext());

    const result = await caller.config.get();

    expect(result.defectDojoWebUrl).toBe("");
  });
});
