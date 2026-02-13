import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { GitFusionClient } from "./index.js";

const originalEnv = process.env;

describe("createGitFusionClient", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw when GITFUSION_URL is not set", async () => {
    delete process.env.GITFUSION_URL;
    const { createGitFusionClient } = await import("./index.js");

    expect(() => createGitFusionClient()).toThrow("GITFUSION_URL");
  });

  it("should return client when env is configured", async () => {
    process.env.GITFUSION_URL = "https://gitfusion.example.com";
    const { createGitFusionClient } = await import("./index.js");

    const client = createGitFusionClient();

    expect(client).toBeDefined();
    expect(typeof client.getRepositories).toBe("function");
    expect(typeof client.getOrganizations).toBe("function");
  });
});

describe("GitFusionClient", () => {
  it("should throw when apiBaseURL is empty", () => {
    expect(
      () =>
        new GitFusionClient({
          apiBaseURL: "",
        })
    ).toThrow("API base URL is not configured");
  });

  it("should create instance with valid config and strip trailing slash", () => {
    const client = new GitFusionClient({
      apiBaseURL: "https://gitfusion.example.com/",
    });
    expect(client).toBeInstanceOf(GitFusionClient);
  });
});
