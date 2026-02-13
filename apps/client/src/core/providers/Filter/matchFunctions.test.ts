import { describe, expect, it } from "vitest";
import { KubeObjectBase } from "@my-project/shared";
import {
  createSearchMatchFunction,
  createNamespaceMatchFunction,
  createExactMatchFunction,
  createArrayIncludesMatchFunction,
  createLabelMatchFunction,
  createBooleanMatchFunction,
} from "./matchFunctions";

const makeKubeObject = (name: string, labels: Record<string, string> = {}, namespace = "default"): KubeObjectBase => ({
  apiVersion: "v1",
  kind: "TestResource",
  metadata: {
    name,
    labels,
    namespace,
    creationTimestamp: "2023-01-01T00:00:00Z",
    uid: "test-uid",
  },
});

const makeMinimalKubeObject = (overrides: Partial<KubeObjectBase["metadata"]> = {}): KubeObjectBase => ({
  apiVersion: "v1",
  kind: "TestResource",
  metadata: {
    name: "test",
    creationTimestamp: "2023-01-01T00:00:00Z",
    uid: "test-uid",
    ...overrides,
  },
});

describe("createSearchMatchFunction", () => {
  const matchFn = createSearchMatchFunction<KubeObjectBase>();

  it("should return true when value is empty", () => {
    expect(matchFn(makeKubeObject("test"), "")).toBe(true);
  });

  it("should return true when value is null/undefined", () => {
    // @ts-expect-error testing null input
    expect(matchFn(makeKubeObject("test"), null)).toBe(true);
    // @ts-expect-error testing undefined input
    expect(matchFn(makeKubeObject("test"), undefined)).toBe(true);
  });

  it("should return true when item is null/undefined", () => {
    // @ts-expect-error testing null item
    expect(matchFn(null, "test")).toBe(true);
  });

  it("should match by name (case-insensitive)", () => {
    const item = makeKubeObject("MyResource");
    expect(matchFn(item, "myresource")).toBe(true);
    expect(matchFn(item, "MYRESOURCE")).toBe(true);
    expect(matchFn(item, "my")).toBe(true);
    expect(matchFn(item, "notfound")).toBe(false);
  });

  it("should match by label key", () => {
    const item = makeKubeObject("test", { "app.kubernetes.io/name": "frontend" });
    expect(matchFn(item, "app.kubernetes")).toBe(true);
    expect(matchFn(item, "nonexistent-label")).toBe(false);
  });

  it("should match by key:value syntax in labels", () => {
    const item = makeKubeObject("test", { env: "production" });
    expect(matchFn(item, "env:production")).toBe(true);
    expect(matchFn(item, "env:prod")).toBe(true);
    expect(matchFn(item, "env:staging")).toBe(false);
  });

  it("should handle key:value with spaces", () => {
    const item = makeKubeObject("test", { env: "production" });
    expect(matchFn(item, "env : production")).toBe(true);
  });

  it("should return false when label key exists but value doesn't match", () => {
    const item = makeKubeObject("test", { env: "dev" });
    expect(matchFn(item, "env:production")).toBe(false);
  });

  it("should handle missing labels gracefully", () => {
    const item = makeMinimalKubeObject();
    expect(matchFn(item, "test")).toBe(true);
    expect(matchFn(item, "label:value")).toBe(false);
  });
});

describe("createNamespaceMatchFunction", () => {
  const matchFn = createNamespaceMatchFunction<KubeObjectBase>();

  it("should return true when value is null/undefined", () => {
    // @ts-expect-error testing null input
    expect(matchFn(makeKubeObject("test"), null)).toBe(true);
    // @ts-expect-error testing undefined input
    expect(matchFn(makeKubeObject("test"), undefined)).toBe(true);
  });

  it("should return true when value is not an array", () => {
    // @ts-expect-error testing invalid input type
    expect(matchFn(makeKubeObject("test"), "string")).toBe(true);
  });

  it("should return true when value is an empty array", () => {
    expect(matchFn(makeKubeObject("test"), [])).toBe(true);
  });

  it("should match when namespace is in the array", () => {
    const item = makeKubeObject("test", {}, "my-namespace");
    expect(matchFn(item, ["my-namespace", "other"])).toBe(true);
  });

  it("should not match when namespace is not in the array", () => {
    const item = makeKubeObject("test", {}, "my-namespace");
    expect(matchFn(item, ["other-namespace"])).toBe(false);
  });

  it("should handle missing namespace", () => {
    const item = makeMinimalKubeObject();
    expect(matchFn(item, [""])).toBe(true);
    expect(matchFn(item, ["default"])).toBe(false);
  });
});

interface TestItem {
  status?: string;
  type?: string;
  active?: boolean;
  missing?: string;
}

describe("createExactMatchFunction", () => {
  const matchFn = createExactMatchFunction<TestItem, string>((item) => item.status);

  it("should return true when filterValue is empty", () => {
    expect(matchFn({ status: "active" }, "")).toBe(true);
  });

  it("should return true when filterValue is 'all'", () => {
    expect(matchFn({ status: "active" }, "all")).toBe(true);
  });

  it("should match when value equals filterValue", () => {
    expect(matchFn({ status: "active" }, "active")).toBe(true);
  });

  it("should not match when value does not equal filterValue", () => {
    expect(matchFn({ status: "active" }, "inactive")).toBe(false);
  });

  it("should handle undefined getValue result", () => {
    const matchFn2 = createExactMatchFunction<TestItem, string>((item) => item.missing);
    expect(matchFn2({}, "something")).toBe(false);
  });
});

describe("createArrayIncludesMatchFunction", () => {
  const matchFn = createArrayIncludesMatchFunction<TestItem>((item) => item.type);

  it("should return true when filterValue is null/undefined", () => {
    // @ts-expect-error testing null input
    expect(matchFn({ type: "app" }, null)).toBe(true);
    // @ts-expect-error testing undefined input
    expect(matchFn({ type: "app" }, undefined)).toBe(true);
  });

  it("should return true when filterValue is not an array", () => {
    // @ts-expect-error testing invalid input type
    expect(matchFn({ type: "app" }, "string")).toBe(true);
  });

  it("should return true when filterValue is empty array", () => {
    expect(matchFn({ type: "app" }, [])).toBe(true);
  });

  it("should match when item value is in the filter array", () => {
    expect(matchFn({ type: "app" }, ["app", "lib"])).toBe(true);
  });

  it("should not match when item value is not in the filter array", () => {
    expect(matchFn({ type: "app" }, ["lib", "autotest"])).toBe(false);
  });

  it("should return false when getValue returns undefined", () => {
    expect(matchFn({}, ["app"])).toBe(false);
  });
});

describe("createLabelMatchFunction", () => {
  const matchFn = createLabelMatchFunction<KubeObjectBase>("env");

  it("should return true when value is empty", () => {
    expect(matchFn(makeKubeObject("test"), "")).toBe(true);
  });

  it("should return true when value is 'all'", () => {
    expect(matchFn(makeKubeObject("test"), "all")).toBe(true);
  });

  it("should match when label value equals filter value", () => {
    const item = makeKubeObject("test", { env: "production" });
    expect(matchFn(item, "production")).toBe(true);
  });

  it("should not match when label value differs", () => {
    const item = makeKubeObject("test", { env: "staging" });
    expect(matchFn(item, "production")).toBe(false);
  });

  it("should not match when label key is missing", () => {
    const item = makeKubeObject("test", { other: "value" });
    expect(matchFn(item, "production")).toBe(false);
  });
});

describe("createBooleanMatchFunction", () => {
  const matchFn = createBooleanMatchFunction<TestItem>((item) => item.active);

  it("should return true when filterValue is false/falsy", () => {
    expect(matchFn({ active: false }, false)).toBe(true);
    expect(matchFn({ active: true }, false)).toBe(true);
  });

  it("should return true when getValue returns true and filterValue is true", () => {
    expect(matchFn({ active: true }, true)).toBe(true);
  });

  it("should return false when getValue returns false and filterValue is true", () => {
    expect(matchFn({ active: false }, true)).toBe(false);
  });

  it("should return false when getValue returns undefined and filterValue is true", () => {
    expect(matchFn({}, true)).toBe(false);
  });
});
