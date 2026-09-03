import { describe, expect, it } from "vitest";
import {
  getSeedBasis,
  getAvailableWidth,
  getColumnMinWidth,
  isColumnResizable,
  getSeedColumnWidth,
  resolveColumnWidths,
  StoredColumnWidths,
} from "./columnWidths";
import { TABLE_WIDTH_DEFAULTS } from "./constants";
import { TableColumn } from "./types";
import { Row, column } from "./testUtils";

const NO_PINS: ReadonlySet<string> = new Set();

/** Column sets whose baseWidths do not total 100. This one sums to 97. */
const pipelineRuns = [
  column("run", 16),
  column("status", 8),
  column("pipeline", 12),
  column("codebase", 10),
  column("branch", 8),
  column("pr", 5),
  column("author", 5),
  column("type", 6),
  column("startedAt", 10),
  column("time", 7),
  column("diagram", 5),
  column("actions", 5),
];

const sumOf = (widths: Record<string, number>, columns: TableColumn<Row>[]) =>
  columns.filter((c) => c.cell.show !== false).reduce((total, c) => total + widths[c.id], 0);

describe("getSeedBasis", () => {
  it("floors at TABLE_MIN_WIDTH", () => {
    expect(getSeedBasis(0)).toBe(1360);
    expect(getSeedBasis(900)).toBe(1360);
  });

  it("uses the container width above the floor", () => {
    expect(getSeedBasis(2200)).toBe(2200);
  });

  it("falls back to the floor for non-finite input", () => {
    expect(getSeedBasis(NaN)).toBe(1360);
    expect(getSeedBasis(Infinity)).toBe(1360);
    expect(getSeedBasis(-500)).toBe(1360);
  });
});

describe("getAvailableWidth", () => {
  it("subtracts only the leading columns that are shown", () => {
    expect(getAvailableWidth(1360, {})).toBe(1360);
    expect(getAvailableWidth(1360, { expand: true })).toBe(1320);
    expect(getAvailableWidth(1360, { selection: true })).toBe(1320);
    expect(getAvailableWidth(1360, { expand: true, selection: true })).toBe(1280);
  });
});

describe("getColumnMinWidth", () => {
  it("defaults to MIN", () => {
    expect(getColumnMinWidth(column("a", 10))).toBe(TABLE_WIDTH_DEFAULTS.MIN);
  });

  it("lets an explicit minWidth win in both directions", () => {
    expect(getColumnMinWidth(column("a", 10, { minWidth: 200 }))).toBe(200);
    expect(getColumnMinWidth(column("a", 10, { minWidth: 20 }))).toBe(20);
  });
});

describe("isColumnResizable", () => {
  it("is true for an ordinary column, including the last one", () => {
    expect(isColumnResizable(column("actions", 5))).toBe(true);
  });

  it("is false when hidden, opted out, or spanning", () => {
    expect(isColumnResizable(column("a", 10, { show: false }))).toBe(false);
    expect(isColumnResizable(column("a", 10, { resizable: false }))).toBe(false);
    expect(isColumnResizable(column("a", 10, { props: { colSpan: 2 } }))).toBe(false);
  });

  it("treats colSpan 1 as ordinary", () => {
    expect(isColumnResizable(column("a", 10, { props: { colSpan: 1 } }))).toBe(true);
  });
});

describe("getSeedColumnWidth", () => {
  it("is a share of the given total, not of 100", () => {
    expect(getSeedColumnWidth(column("run", 16), 97, 1360)).toBe(224);
    expect(getSeedColumnWidth(column("run", 16), 100, 1360)).toBe(218);
  });

  it("scales with the available width", () => {
    expect(getSeedColumnWidth(column("run", 16), 97, 2200)).toBe(363);
  });

  it("clamps to the column floor", () => {
    expect(getSeedColumnWidth(column("pr", 1), 500, 1360)).toBe(TABLE_WIDTH_DEFAULTS.MIN);
  });

  it("returns the floor when the total is zero", () => {
    expect(getSeedColumnWidth(column("a", 0), 0, 1360)).toBe(TABLE_WIDTH_DEFAULTS.MIN);
  });
});

describe("resolveColumnWidths", () => {
  it("fills the available width for a set summing to 97", () => {
    const widths = resolveColumnWidths(pipelineRuns, undefined, 1360, NO_PINS);
    expect(sumOf(widths, pipelineRuns)).toBeCloseTo(1360, -1);
  });

  it("fills the available width for a set summing to 58", () => {
    const pods = [column("name", 20), column("namespace", 15), column("status", 10), column("age", 13)];
    const widths = resolveColumnWidths(pods, undefined, 1360, NO_PINS);
    expect(sumOf(widths, pods)).toBeCloseTo(1360, -1);
    // The regression this normalisation exists for: `age` must stay ~22%, not balloon.
    expect(widths.age / 1360).toBeCloseTo(13 / 58, 2);
  });

  it("fills the available width for a set summing to 153", () => {
    const sca = [column("name", 40), column("version", 33), column("risk", 30), column("epss", 30), column("pv", 20)];
    const widths = resolveColumnWidths(sca, undefined, 1360, NO_PINS);
    expect(sumOf(widths, sca)).toBeCloseTo(1360, -1);
    expect(widths.pv).toBeGreaterThan(TABLE_WIDTH_DEFAULTS.MIN);
  });

  it("holds a pinned width while the rest split what is left", () => {
    const pinned = new Set(["run"]);
    const previous = { run: 300 };
    const widths = resolveColumnWidths(pipelineRuns, undefined, 1360, pinned, previous);

    expect(widths.run).toBe(300);
    expect(sumOf(widths, pipelineRuns)).toBeCloseTo(1360, -1);
  });

  it("overshoots the available width only when column floors bind, so the table scrolls", () => {
    const pinned = new Set(["run"]);
    const widths = resolveColumnWidths(pipelineRuns, undefined, 1360, pinned, { run: 600 });

    // 600px pinned leaves 760px for 81 baseWidth; the five smallest columns hit the column floor.
    expect(widths.run).toBe(600);
    expect(widths.pr).toBe(TABLE_WIDTH_DEFAULTS.MIN);
    expect(sumOf(widths, pipelineRuns)).toBeGreaterThan(1360);
  });

  it("treats a persisted width as pinned", () => {
    const saved: StoredColumnWidths = { run: { width: 600 } };
    const widths = resolveColumnWidths(pipelineRuns, saved, 1360, NO_PINS);
    expect(widths.run).toBe(600);
  });

  it("floors the unpinned columns when the pinned widths leave nothing", () => {
    const pinned = new Set(["run"]);
    const widths = resolveColumnWidths(pipelineRuns, undefined, 1360, pinned, { run: 4000 });

    expect(widths.run).toBe(4000);
    expect(widths.status).toBe(TABLE_WIDTH_DEFAULTS.MIN);
  });

  it("handles every column being pinned", () => {
    const pinned = new Set(pipelineRuns.map((c) => c.id));
    const previous = Object.fromEntries(pipelineRuns.map((c) => [c.id, 100]));
    const widths = resolveColumnWidths(pipelineRuns, undefined, 1360, pinned, previous);

    expect(sumOf(widths, pipelineRuns)).toBe(1200);
  });

  it("clamps a persisted width below the floor", () => {
    const saved: StoredColumnWidths = { run: { width: 5 } };
    const widths = resolveColumnWidths(pipelineRuns, saved, 1360, NO_PINS);
    expect(widths.run).toBe(TABLE_WIDTH_DEFAULTS.MIN);
  });

  it("clamps a persisted width above MAX", () => {
    const saved: StoredColumnWidths = { run: { width: 99999 } };
    const widths = resolveColumnWidths(pipelineRuns, saved, 1360, NO_PINS);
    expect(widths.run).toBe(TABLE_WIDTH_DEFAULTS.MAX);
  });

  it.each([
    ["NaN", NaN],
    ["negative", -100],
    ["zero", 0],
    ["Infinity", Infinity],
    ["a string", "300" as unknown as number],
  ])("discards a persisted width that is %s and seeds normally", (_label, width) => {
    const saved: StoredColumnWidths = { run: { width } };
    const widths = resolveColumnWidths(pipelineRuns, saved, 1360, NO_PINS);

    // A corrupt entry must not leave a floor-width sliver.
    expect(widths.run).toBe(resolveColumnWidths(pipelineRuns, undefined, 1360, NO_PINS).run);
    expect(sumOf(widths, pipelineRuns)).toBeCloseTo(1360, -1);
  });

  it("ignores a persisted entry for a column that no longer exists", () => {
    const saved: StoredColumnWidths = { ghost: { width: 900 } };
    const widths = resolveColumnWidths(pipelineRuns, saved, 1360, NO_PINS);

    expect(widths.ghost).toBeUndefined();
    expect(sumOf(widths, pipelineRuns)).toBeCloseTo(1360, -1);
  });

  it("redistributes a hidden column's share and keeps its own width", () => {
    const columns = pipelineRuns.map((c) => (c.id === "pipeline" ? column("pipeline", 12, { show: false }) : c));
    const widths = resolveColumnWidths(columns, undefined, 1360, NO_PINS);

    expect(sumOf(widths, columns)).toBeCloseTo(1360, -1);
    expect(widths.pipeline).toBeGreaterThan(0);
    expect(widths.run).toBeGreaterThan(resolveColumnWidths(pipelineRuns, undefined, 1360, NO_PINS).run);
  });

  it("subtracts leading columns through the available width", () => {
    const available = getAvailableWidth(getSeedBasis(1360), { expand: true, selection: true });
    const widths = resolveColumnWidths(pipelineRuns, undefined, available, NO_PINS);

    expect(sumOf(widths, pipelineRuns)).toBeCloseTo(1280, -1);
  });
});
