import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { TektonResultsClient } from "./index.js";

const mockJson = vi.fn();
const mockJsonWithHeaders = vi.fn();
const mockText = vi.fn();
const mockCreateHttpService = vi.fn();
const mockReadServiceAccountToken = vi.fn();

vi.mock("../http/index.js", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    createHttpService: (config: unknown) => {
      mockCreateHttpService(config);
      return { json: mockJson, jsonWithHeaders: mockJsonWithHeaders, text: mockText };
    },
  };
});

vi.mock("./serviceAccountToken.js", () => ({
  readServiceAccountToken: () => mockReadServiceAccountToken(),
}));

const originalEnv = process.env;

describe("createTektonResultsClient", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockCreateHttpService.mockClear();
    mockReadServiceAccountToken.mockReset().mockReturnValue(null);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should throw when TEKTON_RESULTS_URL is not set", async () => {
    delete process.env.TEKTON_RESULTS_URL;
    const { createTektonResultsClient } = await import("./index.js");

    expect(() => createTektonResultsClient("default")).toThrow("TEKTON_RESULTS_URL");
  });

  it("attaches an HttpNotConfiguredError cause when TEKTON_RESULTS_URL is missing", async () => {
    delete process.env.TEKTON_RESULTS_URL;
    const { createTektonResultsClient } = await import("./index.js");

    expect(() => createTektonResultsClient("default")).toThrow(
      expect.objectContaining({
        cause: expect.objectContaining({ name: "HttpNotConfiguredError", service: "Tekton Results" }),
      })
    );
  });

  it("should return client when env is configured", async () => {
    process.env.TEKTON_RESULTS_URL = "https://tekton-results.example.com";
    const { createTektonResultsClient } = await import("./index.js");

    const client = createTektonResultsClient("my-namespace");

    expect(client).toBeDefined();
    expect(typeof client.listResults).toBe("function");
    expect(typeof client.getRecord).toBe("function");
  });

  it("sends the ServiceAccount token as a Bearer over HTTPS", async () => {
    process.env.TEKTON_RESULTS_URL = "https://tekton-results.example.com";
    mockReadServiceAccountToken.mockReturnValue("the-sa-token");
    const { createTektonResultsClient } = await import("./index.js");

    createTektonResultsClient("my-namespace");

    expect(mockCreateHttpService).toHaveBeenCalledWith(
      expect.objectContaining({ headers: { Authorization: "Bearer the-sa-token" } })
    );
  });

  it("omits the Authorization header and warns once when the URL is not HTTPS", async () => {
    process.env.TEKTON_RESULTS_URL = "http://tekton-results.example.com";
    mockReadServiceAccountToken.mockReturnValue("the-sa-token");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { createTektonResultsClient } = await import("./index.js");

    createTektonResultsClient("my-namespace");
    createTektonResultsClient("my-namespace");

    expect(mockCreateHttpService).toHaveBeenCalledWith(expect.objectContaining({ headers: undefined }));
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("omits the Authorization header and warns once when no token is mounted", async () => {
    process.env.TEKTON_RESULTS_URL = "https://tekton-results.example.com";
    mockReadServiceAccountToken.mockReturnValue(null);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { createTektonResultsClient } = await import("./index.js");

    createTektonResultsClient("my-namespace");
    createTektonResultsClient("my-namespace");

    expect(mockCreateHttpService).toHaveBeenCalledWith(expect.objectContaining({ headers: undefined }));
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it.each(["HTTPS://tekton-results.example.com", "  https://tekton-results.example.com\n"])(
    "sends the Bearer for an https URL with any case or surrounding whitespace (%j)",
    async (url) => {
      process.env.TEKTON_RESULTS_URL = url;
      mockReadServiceAccountToken.mockReturnValue("the-sa-token");
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { createTektonResultsClient } = await import("./index.js");

      createTektonResultsClient("my-namespace");

      expect(mockCreateHttpService).toHaveBeenCalledWith(
        expect.objectContaining({ headers: { Authorization: "Bearer the-sa-token" } })
      );
      expect(warn).not.toHaveBeenCalled();
    }
  );

  it.each(["tekton-results.example.com", "https//tekton-results.example.com", "ftp://tekton-results.example.com"])(
    "omits the Authorization header for a URL that is not https (%j)",
    async (url) => {
      process.env.TEKTON_RESULTS_URL = url;
      mockReadServiceAccountToken.mockReturnValue("the-sa-token");
      vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { createTektonResultsClient } = await import("./index.js");

      createTektonResultsClient("my-namespace");

      expect(mockCreateHttpService).toHaveBeenCalledWith(expect.objectContaining({ headers: undefined }));
      expect(mockReadServiceAccountToken).not.toHaveBeenCalled();
    }
  );
});

describe("TektonResultsClient", () => {
  it("should throw when apiBaseURL is empty", () => {
    expect(
      () =>
        new TektonResultsClient({
          apiBaseURL: "",
          parent: "default",
        })
    ).toThrow("API base URL is not configured");
  });

  it("should throw when parent (namespace) is empty", () => {
    expect(
      () =>
        new TektonResultsClient({
          apiBaseURL: "https://tekton.example.com",
          parent: "",
        })
    ).toThrow("parent (namespace) is required");
  });

  it("should create instance with valid config", () => {
    const client = new TektonResultsClient({
      apiBaseURL: "https://tekton.example.com",
      parent: "default",
    });
    expect(client).toBeInstanceOf(TektonResultsClient);
  });
});

describe("TektonResultsClient filter choke point", () => {
  function newClient(): TektonResultsClient {
    return new TektonResultsClient({ apiBaseURL: "https://tekton.example.com", parent: "default" });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockJson.mockResolvedValue({});
  });

  it("rejects a scope-escape filter on listResults without issuing the request", async () => {
    const client = newClient();

    await expect(client.listResults({ filter: ") || summary.type == 'tekton.dev/v1.TaskRun'" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(mockJson).not.toHaveBeenCalled();
  });

  it("rejects a backslash-injected literal on listRecords without issuing the request", async () => {
    const client = newClient();

    await expect(client.listRecords("-", { filter: "data.name == 'a\\'b'" })).rejects.toBeInstanceOf(TRPCError);
    expect(mockJson).not.toHaveBeenCalled();
  });

  it("rejects an unbalanced filter on getSummary without issuing the request", async () => {
    const client = newClient();

    await expect(client.getSummary({ filter: "summary.status == 1)" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(mockJson).not.toHaveBeenCalled();
  });

  it("forwards a valid filter to the transport", async () => {
    const client = newClient();

    await client.listResults({ filter: "summary.type == 'tekton.dev/v1.PipelineRun'" });

    expect(mockJson).toHaveBeenCalledTimes(1);
    expect(mockJson.mock.calls[0]?.[1]?.query).toMatchObject({
      filter: "summary.type == 'tekton.dev/v1.PipelineRun'",
    });
  });
});
