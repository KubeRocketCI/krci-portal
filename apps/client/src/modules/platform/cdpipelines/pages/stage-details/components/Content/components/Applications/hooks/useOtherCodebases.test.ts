import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SecurityEnvironmentSummary } from "@my-project/shared";
import { useOtherCodebases } from "./useOtherCodebases";

const { cdPipelineWatch, codebaseListWatch } = vi.hoisted(() => ({
  cdPipelineWatch: { data: undefined as { spec: { applications: string[] } } | undefined },
  codebaseListWatch: {
    query: { data: {} as object | undefined, isPlaceholderData: false },
    data: { array: [] as { metadata: { name: string } }[] },
  },
}));

vi.mock("@/modules/platform/cdpipelines/pages/stage-details/hooks", () => ({
  useCDPipelineWatch: () => cdPipelineWatch,
  useCodebasesWatch: () => codebaseListWatch,
}));

const counts = { critical: 0, high: 0, medium: 0, low: 0, unassigned: 0 };

const summary: SecurityEnvironmentSummary = {
  status: "OK",
  environment: "demo/dev",
  applications: ["app-a", "app-b"].map((codebase) => ({
    codebase,
    workloads: [],
    versions: [],
    counts,
    link: "https://dd.example.com/engagement/1",
  })),
};

describe("useOtherCodebases", () => {
  beforeEach(() => {
    cdPipelineWatch.data = { spec: { applications: ["app-a"] } };
    codebaseListWatch.query = { data: {}, isPlaceholderData: false };
    codebaseListWatch.data = { array: [{ metadata: { name: "app-a" } }] };
  });

  it("returns undefined until the CDPipeline is loaded", () => {
    cdPipelineWatch.data = undefined;

    const { result } = renderHook(() => useOtherCodebases(summary));

    expect(result.current).toBeUndefined();
  });

  it("returns undefined until the Codebases are loaded", () => {
    codebaseListWatch.query = { data: {}, isPlaceholderData: true };

    const { result } = renderHook(() => useOtherCodebases(summary));

    expect(result.current).toBeUndefined();
  });

  it("returns undefined when the Codebases failed to load", () => {
    codebaseListWatch.query = { data: undefined, isPlaceholderData: false };

    const { result } = renderHook(() => useOtherCodebases(summary));

    expect(result.current).toBeUndefined();
  });

  it("excludes the loaded Codebases", () => {
    const { result } = renderHook(() => useOtherCodebases(summary));

    expect(result.current?.entries.map((entry) => entry.codebase)).toEqual(["app-b"]);
  });

  it("excludes only the pipeline's applications when the Codebase list is unfiltered", () => {
    codebaseListWatch.data = { array: [{ metadata: { name: "app-a" } }, { metadata: { name: "app-b" } }] };

    const { result } = renderHook(() => useOtherCodebases(summary));

    expect(result.current?.entries.map((entry) => entry.codebase)).toEqual(["app-b"]);
  });
});
