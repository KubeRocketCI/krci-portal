import { describe, expect, test } from "vitest";
import { triggerBindingSchema } from "@my-project/shared";
import { matchFunctions, TRIGGER_BINDING_LIST_FILTER_NAMES } from "./constants";

const searchMatch = matchFunctions[TRIGGER_BINDING_LIST_FILTER_NAMES.SEARCH]!;
const namespaceMatch = matchFunctions[TRIGGER_BINDING_LIST_FILTER_NAMES.NAMESPACES]!;

const make = (name: string, namespace = "ns") =>
  triggerBindingSchema.parse({
    apiVersion: "triggers.tekton.dev/v1beta1",
    kind: "TriggerBinding",
    metadata: { name, namespace, uid: `u-${name}`, creationTimestamp: "2025-01-01T00:00:00Z" },
    spec: {},
  });

describe("TriggerBinding matchFunctions.search", () => {
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

describe("TriggerBinding matchFunctions.namespaces", () => {
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
