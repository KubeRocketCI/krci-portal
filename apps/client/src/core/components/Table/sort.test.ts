import { describe, expect, it, vi } from "vitest";
import { createColumnComparator, getNextSortOrder, isColumnSortable } from "./sort";
import { SORT_ORDERS } from "./constants";
import type { TableColumn } from "./types";

interface Row {
  metadata: { name: string; startTime?: string | null };
  count?: number;
}

const makeRow = (name: string, startTime?: string | null, count?: number): Row => ({
  metadata: { name, startTime },
  count,
});

const column = (sortKey: Omit<TableColumn<Row>["data"], "render">): TableColumn<Row> =>
  ({
    id: "test",
    label: "Test",
    data: { render: () => null, ...sortKey },
    cell: { baseWidth: 10 },
  }) as TableColumn<Row>;

const nameColumn = column({ columnSortableValuePath: "metadata.name" });
const startTimeColumn = column({ columnSortableValuePath: "metadata.startTime" });
const countColumn = column({ columnSortableValuePath: "count" });

const sortNames = (rows: Row[], comparator: (a: Row, b: Row) => number) =>
  [...rows].sort(comparator).map((row) => row.metadata.name);

describe("createColumnComparator", () => {
  const rows = [makeRow("banana"), makeRow("apple"), makeRow("cherry")];

  it("sorts ascending for ASC", () => {
    const comparator = createColumnComparator(nameColumn, SORT_ORDERS.ASC);
    expect(sortNames(rows, comparator)).toEqual(["apple", "banana", "cherry"]);
  });

  it("sorts descending for DESC", () => {
    const comparator = createColumnComparator(nameColumn, SORT_ORDERS.DESC);
    expect(sortNames(rows, comparator)).toEqual(["cherry", "banana", "apple"]);
  });

  it("keeps source order for UNSET", () => {
    const comparator = createColumnComparator(nameColumn, SORT_ORDERS.UNSET);
    expect(sortNames(rows, comparator)).toEqual(["banana", "apple", "cherry"]);
  });

  it("keeps source order when the column is unresolved", () => {
    const comparator = createColumnComparator(undefined, SORT_ORDERS.ASC);
    expect(sortNames(rows, comparator)).toEqual(["banana", "apple", "cherry"]);
  });

  it("keeps source order when the column declares no sort", () => {
    const comparator = createColumnComparator(column({}), SORT_ORDERS.ASC);
    expect(sortNames(rows, comparator)).toEqual(["banana", "apple", "cherry"]);
  });

  it("returns 0 for equal values so equal rows stay stable", () => {
    const comparator = createColumnComparator(nameColumn, SORT_ORDERS.ASC);
    expect(comparator(makeRow("apple"), makeRow("apple"))).toBe(0);
  });

  it("is case-insensitive", () => {
    const mixedCase = [makeRow("Banana"), makeRow("apple"), makeRow("CHERRY")];
    const comparator = createColumnComparator(nameColumn, SORT_ORDERS.ASC);
    expect(sortNames(mixedCase, comparator)).toEqual(["apple", "Banana", "CHERRY"]);
  });

  it("orders embedded numbers numerically, not lexicographically", () => {
    const numbered = [makeRow("run-10"), makeRow("run-2"), makeRow("run-1")];
    const comparator = createColumnComparator(nameColumn, SORT_ORDERS.ASC);
    expect(sortNames(numbered, comparator)).toEqual(["run-1", "run-2", "run-10"]);
  });

  it("compares timestamps chronologically", () => {
    const runs = [
      makeRow("middle", "2026-09-10T10:30:00Z"),
      makeRow("newest", "2026-09-10T11:00:00Z"),
      makeRow("oldest", "2026-09-09T23:00:00Z"),
    ];
    const comparator = createColumnComparator(startTimeColumn, SORT_ORDERS.DESC);
    expect(sortNames(runs, comparator)).toEqual(["newest", "middle", "oldest"]);
  });

  it("compares numbers numerically", () => {
    const counted = [makeRow("ten", null, 10), makeRow("two", null, 2), makeRow("one", null, 1)];
    const comparator = createColumnComparator(countColumn, SORT_ORDERS.ASC);
    expect(sortNames(counted, comparator)).toEqual(["one", "two", "ten"]);
  });

  it("compares numeric strings as numbers, including differing decimal lengths", () => {
    // SonarQube measures arrive as strings; locale collation would rank 85.3 before 85.25.
    const measured = column({ columnSortableValue: (row) => row.metadata.startTime });
    const rows = [makeRow("a", "85.3"), makeRow("b", "85.25"), makeRow("c", "9.5")];

    expect(sortNames(rows, createColumnComparator(measured, SORT_ORDERS.ASC))).toEqual(["c", "b", "a"]);
  });

  it("ranks rows with no value last in ascending order", () => {
    const runs = [makeRow("pending"), makeRow("started", "2026-09-10T10:00:00Z")];
    const comparator = createColumnComparator(startTimeColumn, SORT_ORDERS.ASC);
    expect(sortNames(runs, comparator)).toEqual(["started", "pending"]);
  });

  it("ranks rows with no value last in descending order too", () => {
    const runs = [makeRow("pending"), makeRow("started", "2026-09-10T10:00:00Z")];
    const comparator = createColumnComparator(startTimeColumn, SORT_ORDERS.DESC);
    expect(sortNames(runs, comparator)).toEqual(["started", "pending"]);
  });

  it('ranks a NaN key last rather than collating it as the text "NaN"', () => {
    const numericId = column({ columnSortableValue: (row) => Number(row.metadata.name) });
    const rows = [makeRow("not-a-number"), makeRow("2"), makeRow("10")];

    expect(sortNames(rows, createColumnComparator(numericId, SORT_ORDERS.ASC))).toEqual(["2", "10", "not-a-number"]);
    expect(sortNames(rows, createColumnComparator(numericId, SORT_ORDERS.DESC))).toEqual(["10", "2", "not-a-number"]);
  });

  it("reads each row's sort key once, not once per comparison", () => {
    const accessor = vi.fn((row: Row) => row.metadata.name);
    const counted = [makeRow("d"), makeRow("b"), makeRow("a"), makeRow("c")];

    sortNames(counted, createColumnComparator(column({ columnSortableValue: accessor }), SORT_ORDERS.ASC));

    expect(accessor).toHaveBeenCalledTimes(counted.length);
  });

  it("treats two missing values as equal", () => {
    const comparator = createColumnComparator(startTimeColumn, SORT_ORDERS.ASC);
    expect(comparator(makeRow("a"), makeRow("b"))).toBe(0);
  });

  it("applies customSortFn as written for ASC", () => {
    const byCount = column({ customSortFn: (a, b) => (a.count ?? 0) - (b.count ?? 0) });
    const counted = [makeRow("three", null, 3), makeRow("one", null, 1), makeRow("two", null, 2)];
    expect(sortNames(counted, createColumnComparator(byCount, SORT_ORDERS.ASC))).toEqual(["one", "two", "three"]);
  });

  it("negates customSortFn for DESC", () => {
    const byCount = column({ customSortFn: (a, b) => (a.count ?? 0) - (b.count ?? 0) });
    const counted = [makeRow("three", null, 3), makeRow("one", null, 1), makeRow("two", null, 2)];
    expect(sortNames(counted, createColumnComparator(byCount, SORT_ORDERS.DESC))).toEqual(["three", "two", "one"]);
  });

  describe("columnSortableValue", () => {
    // A computed key falling back between two fields, as PipelineRun's "Started at" does.
    const effectiveTime = column({
      columnSortableValue: (row) => row.metadata.startTime || row.metadata.name,
    });

    it("sorts by the computed key", () => {
      const runs = [
        makeRow("b", "2026-09-10T10:00:00Z"),
        makeRow("c", "2026-09-10T12:00:00Z"),
        makeRow("a", "2026-09-10T11:00:00Z"),
      ];
      expect(sortNames(runs, createColumnComparator(effectiveTime, SORT_ORDERS.DESC))).toEqual(["c", "a", "b"]);
    });

    it("ranks a row whose computed key falls back ahead of an older row", () => {
      const started = makeRow("started", "2026-09-10T10:00:00Z");
      const queued = makeRow("2026-09-10T12:00:00Z", null);
      const comparator = createColumnComparator(effectiveTime, SORT_ORDERS.DESC);

      expect([started, queued].sort(comparator)[0]).toBe(queued);
    });

    it("applies the same missing-value rule as a value path", () => {
      const maybeMissing = column({ columnSortableValue: (row) => row.metadata.startTime });
      const runs = [makeRow("pending"), makeRow("started", "2026-09-10T10:00:00Z")];

      expect(sortNames(runs, createColumnComparator(maybeMissing, SORT_ORDERS.DESC))).toEqual(["started", "pending"]);
    });
  });
});

describe("createColumnComparator with isPinned", () => {
  // The default branch of a branch list: pinned first whatever the column or direction.
  const isPinned = (row: Row) => row.metadata.name === "banana";
  const rows = [makeRow("cherry"), makeRow("banana"), makeRow("apple")];

  it("ranks pinned rows first in ascending order", () => {
    const comparator = createColumnComparator(nameColumn, SORT_ORDERS.ASC, isPinned);
    expect(sortNames(rows, comparator)).toEqual(["banana", "apple", "cherry"]);
  });

  it("ranks pinned rows first in descending order too", () => {
    const comparator = createColumnComparator(nameColumn, SORT_ORDERS.DESC, isPinned);
    expect(sortNames(rows, comparator)).toEqual(["banana", "cherry", "apple"]);
  });

  it("ranks pinned rows first under an unset sort and keeps source order otherwise", () => {
    const comparator = createColumnComparator(nameColumn, SORT_ORDERS.UNSET, isPinned);
    expect(sortNames(rows, comparator)).toEqual(["banana", "cherry", "apple"]);
  });

  it("orders pinned rows among themselves by the column", () => {
    const twoPinned = (row: Row) => row.metadata.name !== "apple";
    const comparator = createColumnComparator(nameColumn, SORT_ORDERS.DESC, twoPinned);
    expect(sortNames(rows, comparator)).toEqual(["cherry", "banana", "apple"]);
  });

  it("wraps a customSortFn the same way", () => {
    const byCount = column({ customSortFn: (a, b) => (a.count ?? 0) - (b.count ?? 0) });
    const counted = [makeRow("three", null, 3), makeRow("one", null, 1), makeRow("two", null, 2)];
    const pinTwo = (row: Row) => row.metadata.name === "two";

    expect(sortNames(counted, createColumnComparator(byCount, SORT_ORDERS.DESC, pinTwo))).toEqual([
      "two",
      "three",
      "one",
    ]);
  });
});

describe("getNextSortOrder", () => {
  it("starts a newly clicked column at ASC", () => {
    expect(getNextSortOrder(SORT_ORDERS.DESC, false)).toBe(SORT_ORDERS.ASC);
    expect(getNextSortOrder(SORT_ORDERS.ASC, false)).toBe(SORT_ORDERS.ASC);
  });

  it("flips the active column rather than passing through unsorted", () => {
    expect(getNextSortOrder(SORT_ORDERS.ASC, true)).toBe(SORT_ORDERS.DESC);
    expect(getNextSortOrder(SORT_ORDERS.DESC, true)).toBe(SORT_ORDERS.ASC);
  });

  it("starts an unsorted table at ASC", () => {
    expect(getNextSortOrder(SORT_ORDERS.UNSET, true)).toBe(SORT_ORDERS.ASC);
  });
});

describe("isColumnSortable", () => {
  it("is true for a value-path column", () => {
    expect(isColumnSortable(nameColumn)).toBe(true);
  });

  it("is true for a computed-value column", () => {
    expect(isColumnSortable(column({ columnSortableValue: (row) => row.metadata.name }))).toBe(true);
  });

  it("is true for a customSortFn column", () => {
    expect(isColumnSortable(column({ customSortFn: () => 0 }))).toBe(true);
  });

  it("is false when the column declares neither", () => {
    expect(isColumnSortable(column({}))).toBe(false);
  });
});
