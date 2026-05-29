import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { extractByJsonPath } from "./extractByJsonPath";

describe("extractByJsonPath", () => {
  const sample = {
    metadata: {
      name: "pr-1",
      labels: { app: "demo", "app.kubernetes.io/name": "kebab-case-label" },
    },
    spec: { replicas: 3, paused: false, containers: [{ image: "app:1" }, { image: "sidecar:2" }] },
    status: {
      phase: "Running",
      details: { reason: "ok" },
      conditions: [
        { type: "Ready", status: "True" },
        { type: "PodScheduled", status: "True" },
      ],
    },
  };

  it("returns the value at a simple dot path", () => {
    expect(extractByJsonPath(sample, ".status.phase")).toBe("Running");
    expect(extractByJsonPath(sample, ".spec.replicas")).toBe(3);
    expect(extractByJsonPath(sample, ".spec.paused")).toBe(false);
  });

  it("traverses nested objects", () => {
    expect(extractByJsonPath(sample, ".status.details.reason")).toBe("ok");
  });

  it("accepts paths without a leading dot", () => {
    expect(extractByJsonPath(sample, "status.phase")).toBe("Running");
  });

  it("returns undefined for missing keys mid-path", () => {
    expect(extractByJsonPath(sample, ".status.missing.deep")).toBeUndefined();
  });

  it("returns undefined for missing top-level keys", () => {
    expect(extractByJsonPath(sample, ".nope.nada")).toBeUndefined();
  });

  it("returns undefined for null/undefined input", () => {
    expect(extractByJsonPath(null, ".any")).toBeUndefined();
    expect(extractByJsonPath(undefined, ".any")).toBeUndefined();
  });

  it("returns undefined for an empty path string", () => {
    expect(extractByJsonPath(sample, "")).toBeUndefined();
  });

  it("accepts a path that opens directly with a bracket key (no leading dot)", () => {
    expect(extractByJsonPath({ foo: 1 }, '["foo"]')).toBe(1);
  });

  it("returns undefined when a path traverses through a non-object value", () => {
    expect(extractByJsonPath(sample, ".spec.replicas.something")).toBeUndefined();
  });

  describe("array indexing", () => {
    it("reads a value at a numeric bracket index", () => {
      expect(extractByJsonPath(sample, ".spec.containers[0].image")).toBe("app:1");
      expect(extractByJsonPath(sample, ".spec.containers[1].image")).toBe("sidecar:2");
    });

    it("returns undefined when the index is out of bounds", () => {
      expect(extractByJsonPath(sample, ".spec.containers[99].image")).toBeUndefined();
    });

    it("reads through a nested array path", () => {
      expect(extractByJsonPath(sample, ".status.conditions[0].type")).toBe("Ready");
      expect(extractByJsonPath(sample, ".status.conditions[1].status")).toBe("True");
    });
  });

  describe("string-key bracket access", () => {
    it("reads a value with single-quoted bracket key", () => {
      expect(extractByJsonPath(sample, ".metadata.labels['app']")).toBe("demo");
    });

    it("reads a value with double-quoted bracket key", () => {
      expect(extractByJsonPath(sample, '.metadata.labels["app"]')).toBe("demo");
    });

    it("reads a key containing dots (e.g. label keys with prefixes)", () => {
      expect(extractByJsonPath(sample, '.metadata.labels["app.kubernetes.io/name"]')).toBe("kebab-case-label");
    });
  });

  describe("unsupported syntax (returns undefined + dev warning)", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    });

    afterEach(() => {
      warnSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it("returns undefined for filter expressions", () => {
      expect(extractByJsonPath(sample, '.status.conditions[?(@.type=="Ready")].status')).toBeUndefined();
    });

    it("returns undefined for wildcard expressions", () => {
      expect(extractByJsonPath(sample, ".spec.containers[*].image")).toBeUndefined();
    });

    it("emits a console.warn in development mode for unsupported syntax", () => {
      process.env.NODE_ENV = "development";
      extractByJsonPath(sample, ".spec.containers[*].image");
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(/filter or wildcard/i);
    });

    it("does NOT emit a warning in production mode", () => {
      process.env.NODE_ENV = "production";
      extractByJsonPath(sample, ".spec.containers[*].image");
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("returns undefined for unparsable paths (e.g. trailing junk)", () => {
      process.env.NODE_ENV = "development";
      expect(extractByJsonPath(sample, ".status.phase!!!")).toBeUndefined();
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
