import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { DefectDojoClient, LIST_MAX_PAGES, LIST_PAGE_SIZE, toSecuritySeverity } from "./index.js";

const originalEnv = process.env;

describe("createDefectDojoClient", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, DEFECTDOJO_CLUSTER_NAME: "in-cluster" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function catchError(create: () => unknown): unknown {
    try {
      create();
    } catch (error) {
      return error;
    }
    return undefined;
  }

  it("throws a not-configured error when DEFECTDOJO_URL is not set", async () => {
    delete process.env.DEFECTDOJO_URL;
    process.env.DEFECTDOJO_API_KEY = "key";
    const { createDefectDojoClient } = await import("./index.js");

    const error = catchError(() => createDefectDojoClient());

    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).message).toContain("DEFECTDOJO_URL");
    expect((error as TRPCError).cause).toMatchObject({ name: "HttpNotConfiguredError", service: "DefectDojo" });
  });

  it("throws a not-configured error when DEFECTDOJO_API_KEY is not set", async () => {
    process.env.DEFECTDOJO_URL = "https://dd.example.com";
    delete process.env.DEFECTDOJO_API_KEY;
    const { createDefectDojoClient } = await import("./index.js");

    const error = catchError(() => createDefectDojoClient());

    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).message).toContain("DEFECTDOJO_API_KEY");
    expect((error as TRPCError).cause).toMatchObject({ name: "HttpNotConfiguredError", service: "DefectDojo" });
  });

  it("returns a client linking to DEFECTDOJO_WEB_URL", async () => {
    process.env.DEFECTDOJO_URL = "http://defectdojo.krci:8080";
    process.env.DEFECTDOJO_API_KEY = "key";
    process.env.DEFECTDOJO_WEB_URL = "https://dd.example.com/";
    const { createDefectDojoClient } = await import("./index.js");

    expect(createDefectDojoClient().productUrl(3)).toBe("https://dd.example.com/product/3");
  });

  it("throws a not-configured error when DEFECTDOJO_WEB_URL is not set", async () => {
    process.env.DEFECTDOJO_URL = "https://dd.example.com";
    process.env.DEFECTDOJO_API_KEY = "key";
    delete process.env.DEFECTDOJO_WEB_URL;
    const { createDefectDojoClient } = await import("./index.js");

    const error = catchError(() => createDefectDojoClient());

    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).message).toContain("DEFECTDOJO_WEB_URL");
    expect((error as TRPCError).cause).toMatchObject({ name: "HttpNotConfiguredError", service: "DefectDojo" });
  });

  describe("settings of the namespace products", () => {
    beforeEach(() => {
      process.env.DEFECTDOJO_URL = "https://dd.example.com";
      process.env.DEFECTDOJO_API_KEY = "key";
      process.env.DEFECTDOJO_WEB_URL = "https://dd-web.example.com";
      delete process.env.DEFECTDOJO_CLUSTER_NAME;
      delete process.env.DEFECTDOJO_TENANT_LABEL;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("names the cluster in-cluster and warns once while DEFECTDOJO_CLUSTER_NAME is not set", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { createDefectDojoClient } = await import("./index.js");

      expect(createDefectDojoClient().namespaceRef("", "krci-demo-dev")?.cluster).toBe("in-cluster");
      expect(createDefectDojoClient().namespaceRef("", "krci-demo-dev")?.cluster).toBe("in-cluster");

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("DEFECTDOJO_CLUSTER_NAME is not set"));
    });

    it("treats a blank DEFECTDOJO_CLUSTER_NAME as not set", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      process.env.DEFECTDOJO_CLUSTER_NAME = "  ";
      const { createDefectDojoClient } = await import("./index.js");

      expect(createDefectDojoClient().namespaceRef("", "krci-demo-dev")?.cluster).toBe("in-cluster");
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it("takes the cluster name from DEFECTDOJO_CLUSTER_NAME without a warning", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      process.env.DEFECTDOJO_CLUSTER_NAME = "core";
      const { createDefectDojoClient } = await import("./index.js");

      expect(createDefectDojoClient().namespaceRef("in-cluster", "krci-demo-dev")?.cluster).toBe("core");
      expect(warn).not.toHaveBeenCalled();
    });

    it("does not warn while the integration is not configured", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      delete process.env.DEFECTDOJO_URL;
      const { createDefectDojoClient } = await import("./index.js");

      expect(() => createDefectDojoClient()).toThrow("DEFECTDOJO_URL");
      expect(warn).not.toHaveBeenCalled();
    });

    it.each(["Core", "eks_sandbox", "core/prod", "-core"])("rejects the cluster name %s", async (name) => {
      process.env.DEFECTDOJO_CLUSTER_NAME = name;
      const { createDefectDojoClient } = await import("./index.js");

      expect(() => createDefectDojoClient()).toThrow("DEFECTDOJO_CLUSTER_NAME environment variable must be");
    });

    it("requires no tenant tag while DEFECTDOJO_TENANT_LABEL is not set", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { createDefectDojoClient } = await import("./index.js");

      expect(createDefectDojoClient().tenantTags("krci")).toEqual([]);
    });

    it("requires the tag of the tenant label of the namespace", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => undefined);
      process.env.DEFECTDOJO_TENANT_LABEL = "app.edp.epam.com/tenant";
      const { createDefectDojoClient } = await import("./index.js");

      expect(createDefectDojoClient().tenantTags("krci")).toEqual(["k8s-ns-label.app.edp.epam.com/tenant:krci"]);
    });

    it.each(["not a key", "a,b", "a:b", "/name", "prefix//name"])("rejects the tenant label %j", async (label) => {
      vi.spyOn(console, "warn").mockImplementation(() => undefined);
      process.env.DEFECTDOJO_TENANT_LABEL = label;
      const { createDefectDojoClient } = await import("./index.js");

      expect(() => createDefectDojoClient()).toThrow("DEFECTDOJO_TENANT_LABEL environment variable must be");
    });
  });

  describe("isDefectDojoUsable", () => {
    beforeEach(() => {
      process.env.DEFECTDOJO_URL = "https://dd.example.com";
      process.env.DEFECTDOJO_API_KEY = "key";
      process.env.DEFECTDOJO_WEB_URL = "https://dd-web.example.com";
      delete process.env.DEFECTDOJO_CLUSTER_NAME;
      delete process.env.DEFECTDOJO_TENANT_LABEL;
    });

    it("is true when DefectDojo is configured, also with the cluster name and the tenant label unset", async () => {
      const { isDefectDojoUsable } = await import("./index.js");

      expect(isDefectDojoUsable()).toBe(true);
    });

    it("is true with a valid cluster name and a valid tenant label", async () => {
      process.env.DEFECTDOJO_TENANT_LABEL = "app.edp.epam.com/tenant";
      const { isDefectDojoUsable } = await import("./index.js");

      expect(isDefectDojoUsable()).toBe(true);
    });

    it.each(["DEFECTDOJO_URL", "DEFECTDOJO_API_KEY", "DEFECTDOJO_WEB_URL"])(
      "is false when %s is not set",
      async (name) => {
        delete process.env[name];
        const { isDefectDojoUsable } = await import("./index.js");

        expect(isDefectDojoUsable()).toBe(false);
      }
    );

    it.each([
      ["DEFECTDOJO_CLUSTER_NAME", "Not A Label"],
      ["DEFECTDOJO_TENANT_LABEL", "not a key"],
    ])("is false when %s is invalid, as createDefectDojoClient would fail", async (name, value) => {
      process.env[name] = value;
      const { createDefectDojoClient, isDefectDojoUsable } = await import("./index.js");

      expect(isDefectDojoUsable()).toBe(false);
      expect(() => createDefectDojoClient()).toThrow(`${name} environment variable must be`);
    });

    it("reads the environment on every call", async () => {
      const { isDefectDojoUsable } = await import("./index.js");
      expect(isDefectDojoUsable()).toBe(true);

      delete process.env.DEFECTDOJO_API_KEY;

      expect(isDefectDojoUsable()).toBe(false);
    });
  });

  it("shares the response cache between clients", async () => {
    process.env.DEFECTDOJO_URL = "https://dd.example.com";
    process.env.DEFECTDOJO_API_KEY = "key";
    process.env.DEFECTDOJO_WEB_URL = "https://dd-web.example.com";
    const { createDefectDojoClient } = await import("./index.js");
    const fetchMock = vi.fn(async () => jsonResponse({ count: 0, results: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await createDefectDojoClient().getProductByName("shared-cache");
    await createDefectDojoClient().getProductByName("shared-cache");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

/** An engagement as DefectDojo 3.5.200 returns it in the prefetch of a tests list: the product is expanded as well. */
function prefetchedEngagement(id: number, name: string, product: { id: number; name: string }) {
  return {
    id,
    name,
    product: { ...product, prod_type: 1 },
    branch_tag: null,
    build_id: null,
    tags: [],
    active: true,
  };
}

const WEB_URL = "https://dd-web.example.com";

function createClient() {
  return new DefectDojoClient({
    apiBaseURL: "https://dd.example.com/",
    apiKey: "secret-token",
    webBaseURL: "https://dd-web.example.com/",
  });
}

function requestedUrls(fetchMock: ReturnType<typeof vi.fn>): URL[] {
  return fetchMock.mock.calls.map(([url]) => new URL(String(url)));
}

describe("DefectDojoClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("constructor", () => {
    it("requires an API base URL", () => {
      expect(() => new DefectDojoClient({ apiBaseURL: "", apiKey: "key", webBaseURL: WEB_URL })).toThrow(
        "API base URL is not configured"
      );
    });

    it("requires an API key", () => {
      expect(
        () => new DefectDojoClient({ apiBaseURL: "https://dd.example.com", apiKey: "", webBaseURL: WEB_URL })
      ).toThrow("API key is not configured");
    });

    it("requires a web base URL, without falling back to the API base URL", () => {
      expect(
        () => new DefectDojoClient({ apiBaseURL: "https://dd.example.com", apiKey: "key", webBaseURL: "" })
      ).toThrow("web base URL is not configured");
    });
  });

  describe("settings", () => {
    const withCluster = (clusterName?: string) =>
      new DefectDojoClient({ apiBaseURL: "https://dd.example.com", apiKey: "key", webBaseURL: WEB_URL, clusterName });

    it.each([
      ["in-cluster", undefined, "in-cluster"],
      ["", undefined, "in-cluster"],
      ["in-cluster", "core", "core"],
      ["", "core", "core"],
      ["eks-sandbox", "core", "eks-sandbox"],
    ])("names the cluster of a Stage on %j with the setting %j as %s", (stageCluster, setting, expected) => {
      expect(withCluster(setting).namespaceRef(stageCluster, "krci-demo-dev")).toEqual({
        cluster: expected,
        namespace: "krci-demo-dev",
      });
    });

    it.each([
      ["a namespace with a comma", "in-cluster", "a,b"],
      ["an empty namespace", "in-cluster", ""],
      ["a cluster in upper case", "Core", "krci-demo-dev"],
    ])("names no namespace product for %s", (_name, stageCluster, namespace) => {
      expect(withCluster().namespaceRef(stageCluster, namespace)).toBeUndefined();
    });

    it("requires no tenant tag without a tenant label", () => {
      expect(createClient().tenantTags("krci")).toEqual([]);
    });

    it("requires the tag of the tenant label with the tenant made tag-safe", () => {
      const client = new DefectDojoClient({
        apiBaseURL: "https://dd.example.com",
        apiKey: "key",
        webBaseURL: WEB_URL,
        tenantLabel: "app.edp.epam.com/tenant",
      });

      expect(client.tenantTags("My Tenant")).toEqual(["k8s-ns-label.app.edp.epam.com/tenant:my-tenant"]);
    });

    it("writes the tenant label key the way the operator writes tag keys, lower case", () => {
      const client = new DefectDojoClient({
        apiBaseURL: "https://dd.example.com",
        apiKey: "key",
        webBaseURL: WEB_URL,
        tenantLabel: "App.EDP.epam.com/Tenant",
      });

      expect(client.tenantTags("krci")).toEqual(["k8s-ns-label.app.edp.epam.com/tenant:krci"]);
    });
  });

  describe("links", () => {
    it("point to the web UI", () => {
      const client = createClient();

      expect(client.productUrl(1)).toBe("https://dd-web.example.com/product/1");
      expect(client.engagementUrl(2)).toBe("https://dd-web.example.com/engagement/2");
      expect(client.findingUrl(3)).toBe("https://dd-web.example.com/finding/3");
    });
  });

  describe("requests", () => {
    it("send the token in the Authorization header to the v2 API", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ count: 0, results: [] }));

      await createClient().getProductByName("my-service");

      const [url, init] = fetchMock.mock.calls[0];
      expect(new URL(String(url)).origin + new URL(String(url)).pathname).toBe(
        "https://dd.example.com/api/v2/products/"
      );
      expect(init.headers).toMatchObject({ Authorization: "Token secret-token" });
    });
  });

  describe("getProductByName", () => {
    it("returns the product with exactly that name", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          count: 2,
          results: [
            { id: 1, name: "my-service-2", description: "ignored" },
            { id: 2, name: "my-service" },
          ],
        })
      );

      expect(await createClient().getProductByName("my-service")).toEqual({ id: 2, name: "my-service" });
      expect(requestedUrls(fetchMock)[0].searchParams.get("name_exact")).toBe("my-service");
    });

    it("returns null when there is none", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ count: 0, results: [] }));

      expect(await createClient().getProductByName("missing")).toBeNull();
    });

    it("rejects a response of an unexpected shape", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ results: "nope" }));

      await expect(createClient().getProductByName("my-service")).rejects.toThrow();
    });
  });

  describe("listEngagements", () => {
    it("filters by product", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ count: 1, results: [{ id: 4, name: "code-security-main", product: 3 }] })
      );

      expect(await createClient().listEngagements(3)).toEqual([{ id: 4, name: "code-security-main", product: 3 }]);
      expect(requestedUrls(fetchMock)[0].searchParams.get("product")).toBe("3");
    });

    it("reads every page of a long list", async () => {
      const row = (id: number) => ({ id, name: `e${id}`, product: 3 });
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({ count: LIST_PAGE_SIZE + 1, results: Array.from({ length: LIST_PAGE_SIZE }, (_, i) => row(i)) })
        )
        .mockResolvedValueOnce(jsonResponse({ count: LIST_PAGE_SIZE + 1, results: [row(LIST_PAGE_SIZE)] }));

      const engagements = await createClient().listEngagements(3);

      expect(engagements).toHaveLength(501);
      expect(requestedUrls(fetchMock).map((url) => url.searchParams.get("offset"))).toEqual([
        "0",
        String(LIST_PAGE_SIZE),
      ]);
    });

    const fullPage = () => Array.from({ length: LIST_PAGE_SIZE }, (_, i) => ({ id: i, name: `e${i}`, product: 3 }));

    it("stops at the page limit and warns with the path and the total count", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      fetchMock.mockImplementation(async () => jsonResponse({ count: 100_000, results: fullPage() }));

      await createClient().listEngagements(3);

      expect(fetchMock).toHaveBeenCalledTimes(LIST_MAX_PAGES);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("/engagements/"));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("100000"));
      warn.mockRestore();
    });

    it("requests consecutive offsets up to the page limit", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      fetchMock.mockImplementation(async () => jsonResponse({ count: 100_000, results: fullPage() }));

      await createClient().listEngagements(3);

      expect(requestedUrls(fetchMock).map((url) => url.searchParams.get("offset"))).toEqual(
        Array.from({ length: LIST_MAX_PAGES }, (_, i) => String(i * LIST_PAGE_SIZE))
      );
      warn.mockRestore();
    });

    it("stops after the first page when it holds every row", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ count: 1, results: [{ id: 4, name: "e4", product: 3 }] }));

      await createClient().listEngagements(3);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not warn when the last page allowed holds the last row", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      fetchMock.mockImplementation(async () =>
        jsonResponse({ count: LIST_MAX_PAGES * LIST_PAGE_SIZE, results: fullPage() })
      );

      await createClient().listEngagements(3);

      expect(fetchMock).toHaveBeenCalledTimes(LIST_MAX_PAGES);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it("continues after the rows a short page returned, so a server limit below the page size skips nothing", async () => {
      const serverLimit = 100;
      const total = 250;
      fetchMock.mockImplementation(async (url: string) => {
        const offset = Number(new URL(String(url)).searchParams.get("offset"));
        const ids = Array.from({ length: Math.min(serverLimit, total - offset) }, (_, i) => offset + i);
        return jsonResponse({ count: total, results: ids.map((id) => ({ id, name: `e${id}`, product: 3 })) });
      });

      const engagements = await createClient().listEngagements(3);

      expect(engagements.map(({ id }) => id)).toEqual(Array.from({ length: total }, (_, i) => i));
      expect(requestedUrls(fetchMock).map((url) => url.searchParams.get("offset"))).toEqual(["0", "100", "200"]);
    });

    it("stops at an empty page even when the count promises more rows", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ count: 100, results: [{ id: 4, name: "e4", product: 3 }] }))
        .mockResolvedValueOnce(jsonResponse({ count: 100, results: [] }));

      const engagements = await createClient().listEngagements(3);

      expect(engagements).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("tests", () => {
    const test = {
      id: 21,
      title: "VulnerabilityReport deployment/app/app",
      engagement: 4,
      tags: ["k8s-cluster:in-cluster", "k8s-namespace:krci-demo-dev", "k8s-workload:deployment.app"],
      test_type_name: "Trivy Operator Scan",
      version: "main-1",
      updated: "2026-11-11T07:52:16.460319Z",
    };

    it("lists the tests of an engagement without expanding their engagements", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ count: 1, results: [test] }));

      expect(await createClient().listTestsByEngagement(4)).toEqual([test]);

      const params = requestedUrls(fetchMock)[0].searchParams;
      expect(params.get("engagement")).toBe("4");
      expect(params.has("prefetch")).toBe(false);
    });
  });

  describe("listNamespaceTests", () => {
    const NAMESPACE = { cluster: "in-cluster", namespace: "krci-demo-dev" };
    const PRODUCT = { id: 3, name: "in-cluster/krci-demo-dev" };
    const TAGS = ["k8s-cluster:in-cluster", "k8s-namespace:krci-demo-dev"];

    function runtimeTest(id: number, engagement: number, overrides: Record<string, unknown> = {}) {
      return {
        id,
        title: `VulnerabilityReport deployment/app-${id}/app`,
        engagement,
        tags: [...TAGS, `k8s-workload:deployment.app-${id}`],
        ...overrides,
      };
    }

    function answer(tests: unknown[], engagements: Record<string, unknown> = { "4": engagementOf(4) }) {
      fetchMock.mockResolvedValue(
        jsonResponse({ count: tests.length, results: tests, prefetch: { engagement: engagements } })
      );
    }

    function engagementOf(id: number, productId = 3, productName = PRODUCT.name, name = "trivy-operator") {
      return prefetchedEngagement(id, name, { id: productId, name: productName });
    }

    it("reads the tests that carry the cluster and namespace tags, with their engagements, in one request", async () => {
      answer([runtimeTest(21, 4)]);

      const result = await createClient().listNamespaceTests(NAMESPACE);

      expect(result.tests.map(({ id }) => id)).toEqual([21]);
      expect(result.engagements.get(4)).toEqual({ id: 4, name: "trivy-operator", product: PRODUCT });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url] = requestedUrls(fetchMock);
      expect(url.pathname).toBe("/api/v2/tests/");
      expect(url.searchParams.get("tags__and")).toBe(TAGS.join(","));
      expect(url.searchParams.get("prefetch")).toBe("engagement");
      expect(url.searchParams.has("tags")).toBe(false);
    });

    it("rejects a prefetched engagement whose product is only an id", async () => {
      answer([runtimeTest(21, 4)], { "4": { id: 4, name: "trivy-operator", product: 3 } });

      await expect(createClient().listNamespaceTests(NAMESPACE)).rejects.toThrow();
    });

    it("answers a namespace without tests with no tests", async () => {
      answer([]);

      const result = await createClient().listNamespaceTests(NAMESPACE);

      expect(result.tests).toEqual([]);
      expect(result.engagements.size).toBe(0);
    });

    it("drops the tests of other products that carry the same tags", async () => {
      answer([runtimeTest(21, 4), runtimeTest(22, 5), runtimeTest(23, 6)], {
        "4": engagementOf(4),
        "5": engagementOf(5, 8, "x-in-cluster/krci-demo-dev"),
        "6": engagementOf(6, 9, "In-Cluster/krci-demo-dev"),
      });

      const result = await createClient().listNamespaceTests(NAMESPACE);

      expect(result.tests.map(({ id }) => id)).toEqual([21]);
      expect([...result.engagements.keys()]).toEqual([4]);
    });

    it("drops the tests of an engagement other than trivy-operator", async () => {
      answer([runtimeTest(21, 4), runtimeTest(22, 6)], {
        "4": engagementOf(4),
        "6": engagementOf(6, 3, PRODUCT.name, "code-security-main"),
      });

      expect((await createClient().listNamespaceTests(NAMESPACE)).tests.map(({ id }) => id)).toEqual([21]);
    });

    it("drops a test whose engagement is not in the prefetch", async () => {
      answer([runtimeTest(21, 4), runtimeTest(22, 7)]);

      expect((await createClient().listNamespaceTests(NAMESPACE)).tests.map(({ id }) => id)).toEqual([21]);
    });

    it("drops the tests that lack a tag the filter should have required", async () => {
      answer([
        runtimeTest(21, 4),
        runtimeTest(22, 4, { tags: ["k8s-cluster:in-cluster"] }),
        runtimeTest(23, 4, { tags: ["k8s-cluster:other", "k8s-namespace:krci-demo-dev"] }),
      ]);

      expect((await createClient().listNamespaceTests(NAMESPACE)).tests.map(({ id }) => id)).toEqual([21]);
    });

    it("asks for the required tags as well and drops the tests without them", async () => {
      const tenantTag = "k8s-ns-label.app.edp.epam.com/tenant:krci";
      answer([runtimeTest(21, 4, { tags: [...TAGS, tenantTag] }), runtimeTest(22, 4)]);

      const result = await createClient().listNamespaceTests(NAMESPACE, [tenantTag]);

      expect(result.tests.map(({ id }) => id)).toEqual([21]);
      expect(requestedUrls(fetchMock)[0].searchParams.get("tags__and")).toBe([...TAGS, tenantTag].join(","));
    });

    it("reads every page of the tests", async () => {
      const page = (offset: number, length: number) =>
        jsonResponse({
          count: LIST_PAGE_SIZE + 1,
          results: Array.from({ length }, (_, i) => runtimeTest(offset + i, 4)),
          prefetch: { engagement: { "4": engagementOf(4) } },
        });
      fetchMock.mockResolvedValueOnce(page(0, LIST_PAGE_SIZE)).mockResolvedValueOnce(page(LIST_PAGE_SIZE, 1));

      const result = await createClient().listNamespaceTests(NAMESPACE);

      expect(result.tests).toHaveLength(LIST_PAGE_SIZE + 1);
      expect(requestedUrls(fetchMock).map((url) => url.searchParams.get("offset"))).toEqual([
        "0",
        String(LIST_PAGE_SIZE),
      ]);
    });

    it("serves a repeated read from the cache", async () => {
      answer([runtimeTest(21, 4)]);
      const client = createClient();

      await client.listNamespaceTests(NAMESPACE);
      await client.listNamespaceTests(NAMESPACE);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("sends no request for a namespace that is not a DNS label", async () => {
      await expect(createClient().listNamespaceTests({ cluster: "in-cluster", namespace: "a,b" })).rejects.toThrow(
        "DNS labels"
      );

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("countFindings", () => {
    it("asks for one row of the active, non-duplicate findings of the severity", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ count: 54, results: [] }));

      const count = await createClient().countFindings({ engagementIds: [4], severities: ["unassigned"] });

      expect(count).toBe(54);
      const params = requestedUrls(fetchMock)[0].searchParams;
      expect(params.get("test__engagement")).toBe("4");
      expect(params.get("severity")).toBe("Info");
      expect(params.get("active")).toBe("true");
      expect(params.get("duplicate")).toBe("false");
      expect(params.get("limit")).toBe("1");
    });

    it.each([
      ["critical", "Critical"],
      ["high", "High"],
      ["medium", "Medium"],
      ["low", "Low"],
      ["unassigned", "Info"],
    ] as const)("sends %s as %s", async (severity, label) => {
      fetchMock.mockResolvedValue(jsonResponse({ count: 0, results: [] }));

      await createClient().countFindings({ engagementIds: [4], severities: [severity] });

      expect(requestedUrls(fetchMock)[0].searchParams.get("severity")).toBe(label);
    });

    it("sends no severity filter for an empty severity list", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ count: 0, results: [] }));

      await createClient().countFindings({ engagementIds: [4], severities: [] });

      expect(requestedUrls(fetchMock)[0].searchParams.has("severity")).toBe(false);
    });

    it("sends the engagements and the tags a test carries, any, all and none of them", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ count: 0, results: [] }));

      await createClient().countFindings({
        engagementIds: [2, 4],
        anyTestTags: ["oci-image:registry.example.com/krci/app", "oci-image:nginx"],
        allTestTags: ["k8s-ns-label.app.edp.epam.com/tenant:krci"],
        excludeTestTags: ["oci-image:redis"],
      });

      const params = requestedUrls(fetchMock)[0].searchParams;
      expect(params.get("test__engagement")).toBe("2,4");
      expect(params.get("test__tags")).toBe("oci-image:registry.example.com/krci/app,oci-image:nginx");
      expect(params.get("test__tags__and")).toBe("k8s-ns-label.app.edp.epam.com/tenant:krci");
      expect(params.get("not_test__tags")).toBe("oci-image:redis");
      expect(params.has("severity")).toBe(false);
    });

    it("sends no tag filter for empty tag lists", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ count: 0, results: [] }));

      await createClient().countFindings({
        engagementIds: [4],
        anyTestTags: [],
        allTestTags: [],
        excludeTestTags: [],
      });

      const params = requestedUrls(fetchMock)[0].searchParams;
      expect(params.has("test__tags")).toBe(false);
      expect(params.has("test__tags__and")).toBe(false);
      expect(params.has("not_test__tags")).toBe(false);
    });

    it("refuses a query without engagements, which DefectDojo would answer with every finding", async () => {
      await expect(createClient().countFindings({ engagementIds: [] })).rejects.toThrow("at least one engagement");
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("listFindingSeverities", () => {
    it("reads the count and the severities of the first rows without prefetch or ordering", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ count: 120, results: [{ severity: "High", id: 1, extra: "dropped" }, { severity: "Info" }] })
      );

      const result = await createClient().listFindingSeverities(
        { engagementIds: [2, 4], anyTestTags: ["oci-image:nginx"] },
        50
      );

      expect(result).toEqual({ count: 120, severities: ["High", "Info"] });
      const params = requestedUrls(fetchMock)[0].searchParams;
      expect(params.get("limit")).toBe("50");
      expect(params.get("test__engagement")).toBe("2,4");
      expect(params.get("test__tags")).toBe("oci-image:nginx");
      expect(params.get("active")).toBe("true");
      expect(params.get("duplicate")).toBe("false");
      expect(params.has("prefetch")).toBe(false);
      expect(params.has("ordering")).toBe(false);
      expect(params.has("severity")).toBe(false);
    });
  });

  describe("listFindings", () => {
    it("reads one page, most severe first, with the tests of its findings", async () => {
      const finding = { id: 9102, title: "CVE-1 in busybox", severity: "High", test: 18, extra: "dropped" };
      fetchMock.mockResolvedValue(
        jsonResponse({
          count: 3,
          results: [finding],
          prefetch: { test: { "18": { id: 18, title: "Trivy Scan", engagement: 2, tags: [] } } },
        })
      );

      const result = await createClient().listFindings({ engagementIds: [2] }, { offset: 50, limit: 25 });

      expect(result.totalCount).toBe(3);
      expect(result.findings).toEqual([{ id: 9102, title: "CVE-1 in busybox", severity: "High", test: 18 }]);
      expect(result.tests.get(18)).toMatchObject({ id: 18, engagement: 2 });
      const params = requestedUrls(fetchMock)[0].searchParams;
      expect(params.get("ordering")).toBe("numerical_severity,id");
      expect(params.get("prefetch")).toBe("test");
      expect(params.get("offset")).toBe("50");
      expect(params.get("limit")).toBe("25");
      expect(params.get("active")).toBe("true");
      expect(params.get("duplicate")).toBe("false");
    });
  });

  describe("cache", () => {
    it("serves a repeated request from memory", async () => {
      fetchMock.mockImplementation(async () => jsonResponse({ count: 7, results: [] }));
      const client = createClient();

      await client.countFindings({ engagementIds: [4], severities: ["high"] });
      await client.countFindings({ engagementIds: [4], severities: ["high"] });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("keeps different requests apart", async () => {
      fetchMock.mockImplementation(async () => jsonResponse({ count: 7, results: [] }));
      const client = createClient();

      await client.countFindings({ engagementIds: [4], severities: ["high"] });
      await client.countFindings({ engagementIds: [4], severities: ["low"] });

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("shares one call between concurrent identical requests", async () => {
      fetchMock.mockImplementation(async () => jsonResponse({ count: 7, results: [] }));
      const client = createClient();

      await Promise.all([
        client.countFindings({ engagementIds: [4], severities: ["high"] }),
        client.countFindings({ engagementIds: [4], severities: ["high"] }),
      ]);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not keep a failure", async () => {
      fetchMock
        .mockResolvedValueOnce(new Response("boom", { status: 500 }))
        .mockResolvedValueOnce(jsonResponse({ count: 7, results: [] }));
      const client = createClient();

      await expect(client.countFindings({ engagementIds: [4] })).rejects.toThrow("500");
      expect(await client.countFindings({ engagementIds: [4] })).toBe(7);
    });

    it("is not shared between clients created directly", async () => {
      fetchMock.mockImplementation(async () => jsonResponse({ count: 7, results: [] }));

      await createClient().countFindings({ engagementIds: [4] });
      await createClient().countFindings({ engagementIds: [4] });

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});

describe("toSecuritySeverity", () => {
  it.each([
    ["Critical", "critical"],
    ["High", "high"],
    ["Medium", "medium"],
    ["Low", "low"],
    ["Info", "unassigned"],
  ])("maps %s to %s", (label, severity) => {
    expect(toSecuritySeverity(label)).toBe(severity);
  });

  it("maps an unknown name to unassigned", () => {
    expect(toSecuritySeverity("Bogus")).toBe("unassigned");
  });
});
