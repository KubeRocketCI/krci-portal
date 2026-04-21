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

describe("SonarQubeClient scope passthrough", () => {
  const BASE = "https://sonar.example.com";
  let fetchMock: ReturnType<typeof vi.fn>;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(async () => {
    vi.resetModules();
    originalFetch = globalThis.fetch;
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ component: { key: "k", name: "k", measures: [] } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function newClient() {
    const { SonarQubeClient } = await import("./index.js");
    return new SonarQubeClient({ apiBaseURL: BASE, token: "tkn", timeoutMs: 500 });
  }

  function capturedUrl(): string {
    const firstCall = fetchMock.mock.calls[0];
    return String(firstCall[0]);
  }

  it("getComponent appends pullRequest when supplied", async () => {
    const client = await newClient();
    await client.getComponent("my-proj", { pullRequest: "123" });
    const url = capturedUrl();
    expect(url).toContain("component=my-proj");
    expect(url).toContain("pullRequest=123");
    expect(url).not.toContain("branch=");
  });

  it("getComponent appends branch when supplied", async () => {
    const client = await newClient();
    await client.getComponent("my-proj", { branch: "main" });
    const url = capturedUrl();
    expect(url).toContain("component=my-proj");
    expect(url).toContain("branch=main");
    expect(url).not.toContain("pullRequest=");
  });

  it("getComponent omits scope params when scope is undefined", async () => {
    const client = await newClient();
    await client.getComponent("my-proj");
    const url = capturedUrl();
    expect(url).not.toContain("pullRequest=");
    expect(url).not.toContain("branch=");
  });

  it("getMeasures appends pullRequest when supplied", async () => {
    const client = await newClient();
    await client.getMeasures("my-proj", ["bugs"], { pullRequest: "123" });
    const url = capturedUrl();
    expect(url).toContain("component=my-proj");
    expect(url).toContain("pullRequest=123");
    expect(url).not.toContain("branch=");
  });

  it("getMeasures appends branch when supplied", async () => {
    const client = await newClient();
    await client.getMeasures("my-proj", ["bugs"], { branch: "main" });
    const url = capturedUrl();
    expect(url).toContain("component=my-proj");
    expect(url).toContain("branch=main");
    expect(url).not.toContain("pullRequest=");
  });

  it("getMeasures omits scope params when scope is undefined", async () => {
    const client = await newClient();
    await client.getMeasures("my-proj", ["bugs"]);
    const url = capturedUrl();
    expect(url).not.toContain("pullRequest=");
    expect(url).not.toContain("branch=");
  });

  it("getQualityGateStatus appends pullRequest when supplied", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ projectStatus: { status: "OK", conditions: [] } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = await newClient();
    await client.getQualityGateStatus("my-proj", { pullRequest: "123" });
    const url = capturedUrl();
    expect(url).toContain("projectKey=my-proj");
    expect(url).toContain("pullRequest=123");
    expect(url).not.toContain("branch=");
  });

  it("getQualityGateStatus appends branch when supplied", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ projectStatus: { status: "OK", conditions: [] } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = await newClient();
    await client.getQualityGateStatus("my-proj", { branch: "main" });
    const url = capturedUrl();
    expect(url).toContain("projectKey=my-proj");
    expect(url).toContain("branch=main");
    expect(url).not.toContain("pullRequest=");
  });

  it("getQualityGateStatus omits scope params when scope is undefined", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ projectStatus: { status: "OK", conditions: [] } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = await newClient();
    await client.getQualityGateStatus("my-proj");
    const url = capturedUrl();
    expect(url).not.toContain("pullRequest=");
    expect(url).not.toContain("branch=");
  });

  const emptyIssuesResp = new Response(
    JSON.stringify({
      total: 0,
      p: 1,
      ps: 25,
      paging: { pageIndex: 1, pageSize: 25, total: 0 },
      issues: [],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );

  it("getIssues appends pullRequest when supplied", async () => {
    fetchMock.mockResolvedValueOnce(emptyIssuesResp.clone());
    const client = await newClient();
    await client.getIssues({ componentKeys: "my-proj", resolved: "false", p: 1, ps: 25, pullRequest: "123" });
    const url = capturedUrl();
    expect(url).toContain("componentKeys=my-proj");
    expect(url).toContain("pullRequest=123");
    expect(url).not.toContain("branch=");
  });

  it("getIssues appends branch when supplied", async () => {
    fetchMock.mockResolvedValueOnce(emptyIssuesResp.clone());
    const client = await newClient();
    await client.getIssues({ componentKeys: "my-proj", resolved: "false", p: 1, ps: 25, branch: "main" });
    const url = capturedUrl();
    expect(url).toContain("componentKeys=my-proj");
    expect(url).toContain("branch=main");
    expect(url).not.toContain("pullRequest=");
  });

  it("getIssues omits scope params when neither supplied", async () => {
    fetchMock.mockResolvedValueOnce(emptyIssuesResp.clone());
    const client = await newClient();
    await client.getIssues({ componentKeys: "my-proj", resolved: "false", p: 1, ps: 25 });
    const url = capturedUrl();
    expect(url).not.toContain("pullRequest=");
    expect(url).not.toContain("branch=");
  });
});
