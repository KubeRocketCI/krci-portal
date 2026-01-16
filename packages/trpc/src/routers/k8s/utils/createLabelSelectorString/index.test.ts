import { describe, expect, test } from "vitest";
import { createLabelSelectorString } from "./index.js";

describe("createLabelSelectorString", () => {
  test("creates label selector string from labels object", () => {
    const labels = {
      app: "my-app",
      env: "production",
    };

    const result = createLabelSelectorString(labels);

    expect(result).toBe("app=my-app,env=production");
  });

  test("handles single label", () => {
    const labels = {
      app: "my-app",
    };

    const result = createLabelSelectorString(labels);

    expect(result).toBe("app=my-app");
  });

  test("returns undefined for undefined input", () => {
    const result = createLabelSelectorString(undefined);

    expect(result).toBeUndefined();
  });

  test("handles empty labels object", () => {
    const result = createLabelSelectorString({});

    expect(result).toBe("");
  });

  test("handles labels with special characters", () => {
    const labels = {
      "app.kubernetes.io/name": "my-app",
      "app.kubernetes.io/version": "1.0.0",
    };

    const result = createLabelSelectorString(labels);

    expect(result).toBe("app.kubernetes.io/name=my-app,app.kubernetes.io/version=1.0.0");
  });

  test("handles labels with numeric values", () => {
    const labels = {
      version: "1",
      count: "42",
    };

    const result = createLabelSelectorString(labels);

    expect(result).toBe("version=1,count=42");
  });

  test("handles multiple labels in consistent order", () => {
    const labels = {
      z: "last",
      a: "first",
      m: "middle",
    };

    const result = createLabelSelectorString(labels);

    // Order should be consistent (Object.entries order)
    expect(result).toContain("z=last");
    expect(result).toContain("a=first");
    expect(result).toContain("m=middle");
  });
});
