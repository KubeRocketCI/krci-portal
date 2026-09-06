import { describe, expect, test } from "vitest";
import { CHART_STATUS_COLOR } from "@/k8s/constants/colors";
import type { RequestError } from "@/core/types/global";
import {
  describeStatusSlices,
  toCountRow,
  toResourceTileState,
  toStatusSlices,
  type ResourceHealthCounts,
} from "./statusSegments";

const full: ResourceHealthCounts = { ok: 12, inProgress: 4, error: 3, cancelled: 2, unknown: 1 };

describe("toStatusSlices", () => {
  test("emits every non-empty bucket in ring order with its chart colour", () => {
    expect(toStatusSlices(full)).toEqual([
      { name: "Ok", value: 12, color: CHART_STATUS_COLOR.SUCCESS },
      { name: "In Progress", value: 4, color: CHART_STATUS_COLOR.IN_PROGRESS },
      { name: "Failed", value: 3, color: CHART_STATUS_COLOR.ERROR },
      { name: "Cancelled", value: 2, color: CHART_STATUS_COLOR.CANCELLED },
      { name: "Unknown", value: 1, color: CHART_STATUS_COLOR.UNKNOWN },
    ]);
  });

  test("slice values sum to the total the donut prints in its centre", () => {
    const total = full.ok + full.inProgress + full.error + full.cancelled + full.unknown;

    expect(toStatusSlices(full).reduce((sum, slice) => sum + slice.value, 0)).toBe(total);
  });

  test("drops empty buckets", () => {
    expect(toStatusSlices({ ok: 5, inProgress: 0, error: 0, cancelled: 0, unknown: 0 })).toEqual([
      { name: "Ok", value: 5, color: CHART_STATUS_COLOR.SUCCESS },
    ]);
  });

  test("returns no slices when nothing is counted", () => {
    expect(toStatusSlices({ ok: 0, inProgress: 0, error: 0, cancelled: 0, unknown: 0 })).toEqual([]);
  });
});

describe("toCountRow", () => {
  test("prints Ok and Failed even at zero, so tiles stay comparable", () => {
    expect(toCountRow({ ok: 0, inProgress: 0, error: 0, cancelled: 0, unknown: 0 })).toEqual([
      { name: "Ok", value: 0, color: CHART_STATUS_COLOR.SUCCESS },
      { name: "Failed", value: 0, color: CHART_STATUS_COLOR.ERROR },
    ]);
  });

  test("adds the other buckets only when non-zero, in ring order", () => {
    expect(toCountRow({ ok: 1, inProgress: 2, error: 0, cancelled: 0, unknown: 0 })).toEqual([
      { name: "Ok", value: 1, color: CHART_STATUS_COLOR.SUCCESS },
      { name: "In Progress", value: 2, color: CHART_STATUS_COLOR.IN_PROGRESS },
      { name: "Failed", value: 0, color: CHART_STATUS_COLOR.ERROR },
    ]);
  });
});

describe("toResourceTileState", () => {
  const error = new Error("watch failed") as unknown as RequestError;

  test("reports an error even though a failed watch also leaves the data unloaded", () => {
    expect(toResourceTileState({ counts: { total: null }, error })).toEqual({ kind: "error", error });
  });

  test("keeps loaded counts when a refetch fails", () => {
    const state = toResourceTileState({
      counts: { total: 1, ok: 1, inProgress: 0, error: 0, cancelled: 0, unknown: 0 },
      error,
    });

    expect(state.kind).toBe("ready");
  });

  test("reports loading while the total is null", () => {
    expect(toResourceTileState({ counts: { total: null }, error: null })).toEqual({ kind: "loading" });
  });

  test("reports a genuine empty namespace as ready with no slices, not as loading", () => {
    expect(
      toResourceTileState({
        counts: { total: 0, ok: 0, inProgress: 0, error: 0, cancelled: 0, unknown: 0 },
        error: null,
      })
    ).toEqual({
      kind: "ready",
      total: 0,
      slices: [],
      countRow: [
        { name: "Ok", value: 0, color: CHART_STATUS_COLOR.SUCCESS },
        { name: "Failed", value: 0, color: CHART_STATUS_COLOR.ERROR },
      ],
    });
  });

  test("carries the in-progress and cancelled buckets a PipelineRun tile must draw", () => {
    const state = toResourceTileState({ counts: { total: 22, ...full }, error: null });

    expect(state).toMatchObject({ kind: "ready", total: 22 });
    expect(state.kind === "ready" && state.slices.map((slice) => slice.name)).toContain("In Progress");
    expect(state.kind === "ready" && state.slices.map((slice) => slice.name)).toContain("Cancelled");
  });
});

describe("describeStatusSlices", () => {
  test("spells out each segment for a screen reader", () => {
    expect(describeStatusSlices("Pipelines", 22, toStatusSlices(full))).toBe(
      "Pipelines: 22 resources. 12 ok, 4 in progress, 3 failed, 2 cancelled, 1 unknown."
    );
  });

  test("says there are no segments rather than trailing off", () => {
    expect(describeStatusSlices("Codebases", 0, [])).toBe("Codebases: 0 resources. No status segments.");
  });
});
