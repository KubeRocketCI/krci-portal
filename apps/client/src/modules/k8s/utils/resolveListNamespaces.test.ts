import { describe, expect, it } from "vitest";
import { resolveListNamespaces } from "./resolveListNamespaces";

describe("resolveListNamespaces", () => {
  it("returns undefined when nothing is selected (falls back to allowed namespaces)", () => {
    expect(resolveListNamespaces({})).toBeUndefined();
    expect(resolveListNamespaces({ filterNamespaces: [] })).toBeUndefined();
  });

  it("scopes to a single namespace when a `?namespace=` deep-link is present", () => {
    expect(resolveListNamespaces({ urlNamespace: "team-a" })).toEqual(["team-a"]);
  });

  it("uses the filter selection when provided", () => {
    expect(resolveListNamespaces({ filterNamespaces: ["team-a", "team-b"] })).toEqual(["team-a", "team-b"]);
  });

  it("prefers the deep-link namespace over the filter selection", () => {
    expect(resolveListNamespaces({ urlNamespace: "team-a", filterNamespaces: ["team-b", "team-c"] })).toEqual([
      "team-a",
    ]);
  });
});
