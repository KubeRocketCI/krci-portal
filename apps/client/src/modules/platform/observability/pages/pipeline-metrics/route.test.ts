import { TIME_RANGES } from "@my-project/shared";
import { describe, expect, it, vi } from "vitest";

// The real module builds the whole route tree; only getParentRoute needs it, and it never runs here.
vi.mock("@/core/router/routes", () => ({ routeObservability: {} }));

import { pipelineMetricsSearchSchema } from "./route";

describe("pipelineMetricsSearchSchema", () => {
  it("accepts an empty search", () => {
    expect(pipelineMetricsSearchSchema.parse({})).toEqual({});
  });

  it("accepts a valid codebase name", () => {
    expect(pipelineMetricsSearchSchema.parse({ codebase: "my-app" }).codebase).toBe("my-app");
  });

  it("coerces values TanStack Router's JSON.parse turned into non-strings", () => {
    expect(pipelineMetricsSearchSchema.parse({ codebase: 123 }).codebase).toBe("123");
    expect(pipelineMetricsSearchSchema.parse({ codebase: true }).codebase).toBe("true");
    expect(pipelineMetricsSearchSchema.parse({ codebase: null }).codebase).toBe("null");
  });

  it("drops a repeated query param, which arrives as an array", () => {
    expect(pipelineMetricsSearchSchema.parse({ codebase: ["a", "b"] }).codebase).toBeUndefined();
  });

  it("drops a codebase that is not a valid Kubernetes name", () => {
    expect(pipelineMetricsSearchSchema.parse({ codebase: "My_App" }).codebase).toBeUndefined();
    expect(pipelineMetricsSearchSchema.parse({ codebase: "-leading-hyphen" }).codebase).toBeUndefined();
    expect(pipelineMetricsSearchSchema.parse({ codebase: "" }).codebase).toBeUndefined();
    expect(pipelineMetricsSearchSchema.parse({ codebase: "a".repeat(254) }).codebase).toBeUndefined();
  });

  it("drops a codebase carrying CEL injection characters", () => {
    expect(pipelineMetricsSearchSchema.parse({ codebase: "x' || 1==1" }).codebase).toBeUndefined();
    expect(pipelineMetricsSearchSchema.parse({ codebase: "a'\\b" }).codebase).toBeUndefined();
  });

  it("accepts every known time range", () => {
    for (const timeRange of Object.values(TIME_RANGES)) {
      expect(pipelineMetricsSearchSchema.parse({ timeRange }).timeRange).toBe(timeRange);
    }
  });

  it("drops an unknown time range", () => {
    expect(pipelineMetricsSearchSchema.parse({ timeRange: "1y" }).timeRange).toBeUndefined();
    expect(pipelineMetricsSearchSchema.parse({ timeRange: 30 }).timeRange).toBeUndefined();
  });

  it("keeps a valid param when the other one is invalid", () => {
    expect(pipelineMetricsSearchSchema.parse({ codebase: "my-app", timeRange: "1y" })).toEqual({
      codebase: "my-app",
      timeRange: undefined,
    });
  });
});
