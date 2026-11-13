import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { DefectDojoClient, LIST_MAX_PAGES, LIST_PAGE_SIZE, toSecuritySeverity } from "./index.js";

const originalEnv = process.env;

describe("createDefectDojoClient", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
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
        jsonResponse({ count: 1, results: [{ id: 4, name: "runtime:demo-dev", product: 3 }] })
      );

      expect(await createClient().listEngagements(3)).toEqual([{ id: 4, name: "runtime:demo-dev", product: 3 }]);
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

    it("stops at the page limit and warns with the path and the total count", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      fetchMock.mockImplementation(async () => jsonResponse({ count: 100_000, results: [] }));

      await createClient().listEngagements(3);

      expect(fetchMock).toHaveBeenCalledTimes(LIST_MAX_PAGES);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("/engagements/"));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("100000"));
      warn.mockRestore();
    });

    it("requests consecutive offsets up to the page limit", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      fetchMock.mockImplementation(async () => jsonResponse({ count: 100_000, results: [] }));

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
      fetchMock.mockImplementation(async () => jsonResponse({ count: LIST_MAX_PAGES * LIST_PAGE_SIZE, results: [] }));

      await createClient().listEngagements(3);

      expect(fetchMock).toHaveBeenCalledTimes(LIST_MAX_PAGES);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe("tests", () => {
    const test = {
      id: 21,
      title: "VulnerabilityReport deployment/app/app",
      engagement: 4,
      tags: ["krci-env:demo.dev"],
      test_type_name: "Trivy Operator Scan",
      version: "main-1",
      updated: "2026-11-11T07:52:16.460319Z",
    };

    it("lists the tests of an engagement with the engagements they belong to", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          count: 1,
          results: [test],
          prefetch: {
            engagement: { "4": { id: 4, name: "runtime:demo-dev", product: { id: 3, name: "my-service" } } },
          },
        })
      );

      const result = await createClient().listTestsByEngagement(4);

      expect(result.tests).toEqual([test]);
      expect(result.engagements.get(4)).toEqual({
        id: 4,
        name: "runtime:demo-dev",
        product: { id: 3, name: "my-service" },
      });
      const params = requestedUrls(fetchMock)[0].searchParams;
      expect(params.get("engagement")).toBe("4");
      expect(params.get("prefetch")).toBe("engagement");
    });

    it("lists the tests that carry all the tags", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ count: 1, results: [test] }));

      const result = await createClient().listTestsByTags(["krci-env:demo.dev", "krci-tenant:krci"]);

      expect(result.tests).toHaveLength(1);
      expect(result.engagements.size).toBe(0);
      const params = requestedUrls(fetchMock)[0].searchParams;
      expect(params.get("tags__and")).toBe("krci-env:demo.dev,krci-tenant:krci");
      expect(params.has("tags")).toBe(false);
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

    it("sends the engagements and the test tags", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ count: 0, results: [] }));

      await createClient().countFindings({
        engagementIds: [2, 4],
        testTags: ["krci-tenant:krci", "krci-env:demo.dev"],
      });

      const params = requestedUrls(fetchMock)[0].searchParams;
      expect(params.get("test__engagement")).toBe("2,4");
      expect(params.get("test__tags__and")).toBe("krci-tenant:krci,krci-env:demo.dev");
      expect(params.has("test__tags")).toBe(false);
      expect(params.has("severity")).toBe(false);
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
        { engagementIds: [2, 4], testTags: ["krci-tenant:krci", "krci-env:demo.dev"] },
        50
      );

      expect(result).toEqual({ count: 120, severities: ["High", "Info"] });
      const params = requestedUrls(fetchMock)[0].searchParams;
      expect(params.get("limit")).toBe("50");
      expect(params.get("test__engagement")).toBe("2,4");
      expect(params.get("test__tags__and")).toBe("krci-tenant:krci,krci-env:demo.dev");
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
