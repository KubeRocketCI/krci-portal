import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { TektonResultsClient } from "./index.js";

const mockJson = vi.fn();
const mockJsonWithHeaders = vi.fn();
const mockText = vi.fn();

vi.mock("../http/index.js", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    createHttpService: () => ({ json: mockJson, jsonWithHeaders: mockJsonWithHeaders, text: mockText }),
  };
});

const originalEnv = process.env;

describe("createTektonResultsClient", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
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
