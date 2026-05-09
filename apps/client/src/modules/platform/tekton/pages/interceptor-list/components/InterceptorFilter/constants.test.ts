import { describe, expect, test } from "vitest";
import { interceptorSchema } from "@my-project/shared";
import { matchFunctions, INTERCEPTOR_LIST_FILTER_NAMES } from "./constants";

const searchMatch = matchFunctions[INTERCEPTOR_LIST_FILTER_NAMES.SEARCH]!;
const namespaceMatch = matchFunctions[INTERCEPTOR_LIST_FILTER_NAMES.NAMESPACES]!;

const make = (name: string, namespace = "ns") =>
  interceptorSchema.parse({
    apiVersion: "triggers.tekton.dev/v1alpha1",
    kind: "Interceptor",
    metadata: { name, namespace, uid: `u-${name}`, creationTimestamp: "2025-01-01T00:00:00Z" },
  });

describe("Interceptor matchFunctions.search", () => {
  test("empty search passes everything", () => {
    expect(searchMatch(make("github"), "")).toBe(true);
  });
  test("name substring match", () => {
    expect(searchMatch(make("github-build"), "build")).toBe(true);
  });
  test("name substring match is case-insensitive", () => {
    expect(searchMatch(make("Github-Build"), "github")).toBe(true);
  });
  test("non-matching name dropped", () => {
    expect(searchMatch(make("github-build"), "gitlab")).toBe(false);
  });
});

describe("Interceptor matchFunctions.namespaces", () => {
  test("empty selection passes everything", () => {
    expect(namespaceMatch(make("x", "a"), [])).toBe(true);
  });
  test("matching namespace kept", () => {
    expect(namespaceMatch(make("x", "a"), ["a"])).toBe(true);
  });
  test("non-matching namespace dropped", () => {
    expect(namespaceMatch(make("x", "a"), ["b"])).toBe(false);
  });
});
