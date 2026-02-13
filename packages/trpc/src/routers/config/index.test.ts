import { createMockedContext } from "../../__mocks__/context.js";
import { createCaller } from "../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

    const mockContext = createMockedContext();
    const caller = createCaller(mockContext);

    const result = await caller.config.get();

    expect(result).toEqual({
      clusterName: "my-cluster",
      defaultNamespace: "default-ns",
      sonarWebUrl: "https://sonar.example.com",
      dependencyTrackWebUrl: "https://dt.example.com",
    });
  });

  it("should fallback to empty string when env vars are missing", async () => {
    delete process.env.DEFAULT_CLUSTER_NAME;
    delete process.env.DEFAULT_CLUSTER_NAMESPACE;
    delete process.env.SONAR_WEB_URL;
    delete process.env.SONAR_HOST_URL;
    delete process.env.DEPENDENCY_TRACK_WEB_URL;
    delete process.env.DEPENDENCY_TRACK_URL;

    const mockContext = createMockedContext();
    const caller = createCaller(mockContext);

    const result = await caller.config.get();

    expect(result).toEqual({
      clusterName: "",
      defaultNamespace: "",
      sonarWebUrl: "",
      dependencyTrackWebUrl: "",
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
});
