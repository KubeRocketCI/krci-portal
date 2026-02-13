import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { TektonResultsClient } from "./index.js";

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
