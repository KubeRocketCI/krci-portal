import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const originalEnv = process.env;

describe("createSonarQubeClient", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw when SONAR_HOST_URL is not set", async () => {
    delete process.env.SONAR_HOST_URL;
    const { createSonarQubeClient } = await import("./index.js");

    expect(() => createSonarQubeClient()).toThrow("SONAR_HOST_URL");
  });

  it("should throw when SONAR_TOKEN is not set", async () => {
    process.env.SONAR_HOST_URL = "https://sonar.example.com";
    delete process.env.SONAR_TOKEN;
    const { createSonarQubeClient } = await import("./index.js");

    expect(() => createSonarQubeClient()).toThrow("SONAR_TOKEN");
  });

  it("should return client when env is configured", async () => {
    process.env.SONAR_HOST_URL = "https://sonar.example.com";
    process.env.SONAR_TOKEN = "token";
    const { createSonarQubeClient } = await import("./index.js");

    const client = createSonarQubeClient();

    expect(client).toBeDefined();
    expect(typeof client.getProjects).toBe("function");
    expect(typeof client.getIssues).toBe("function");
  });
});
