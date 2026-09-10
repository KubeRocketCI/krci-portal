import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTableSort } from "./useTableSort";
import { SORT_ORDERS } from "../constants";
import type { TableColumn, TableSort } from "../types";

interface Row {
  metadata: { name: string };
  rank: number;
}

const rows: Row[] = [
  { metadata: { name: "banana" }, rank: 2 },
  { metadata: { name: "apple" }, rank: 3 },
  { metadata: { name: "cherry" }, rank: 1 },
];

const columns: TableColumn<Row>[] = [
  {
    id: "name",
    label: "Name",
    data: { render: () => null, columnSortableValuePath: "metadata.name" },
    cell: { baseWidth: 10 },
  },
  {
    id: "rank",
    label: "Rank",
    data: { render: () => null, customSortFn: (a, b) => a.rank - b.rank },
    cell: { baseWidth: 10 },
  },
];

const renderSort = (defaultSort?: TableSort) =>
  renderHook(({ sort }: { sort?: TableSort }) => useTableSort<Row>(columns, sort), {
    initialProps: { sort: defaultSort },
  });

/** Re-renders with a different column set, as switching resource kind does. */
const renderWithColumns = (
  initialColumns: TableColumn<Row>[],
  defaultSort?: TableSort,
  isRowPinned?: (row: Row) => boolean
) =>
  renderHook(({ cols }: { cols: TableColumn<Row>[] }) => useTableSort<Row>(cols, defaultSort, isRowPinned), {
    initialProps: { cols: initialColumns },
  });

/** What `useColumnSync` produces on a toggle: one column object replaced, the rest kept by identity. */
const withVisibility = (cols: TableColumn<Row>[], id: string, show: boolean) =>
  cols.map((column) => (column.id === id ? { ...column, cell: { ...column.cell, show } } : column));

const names = (comparator: (a: Row, b: Row) => number) => [...rows].sort(comparator).map((row) => row.metadata.name);

describe("useTableSort", () => {
  it("resolves the default sortBy against the column set", () => {
    const { result } = renderSort({ sortBy: "name", order: SORT_ORDERS.ASC });
    expect(names(result.current.comparator)).toEqual(["apple", "banana", "cherry"]);
  });

  it("builds the comparator from the column's value path, not from the column id", () => {
    // `sortBy` is the column id ("name"); the data lives at "metadata.name". Resolving
    // the id as a data path yields no ordering.
    const { result } = renderSort({ sortBy: "name", order: SORT_ORDERS.DESC });
    expect(names(result.current.comparator)).toEqual(["cherry", "banana", "apple"]);
  });

  it("uses the column's customSortFn when it has no value path", () => {
    const { result } = renderSort({ sortBy: "rank", order: SORT_ORDERS.ASC });
    expect(names(result.current.comparator)).toEqual(["cherry", "banana", "apple"]);
  });

  it("keeps source order when sortBy matches no column", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderSort({ sortBy: "nonexistent", order: SORT_ORDERS.ASC });

    expect(names(result.current.comparator)).toEqual(["banana", "apple", "cherry"]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("nonexistent"));
    warn.mockRestore();
  });

  it("keeps source order when the caller passes no default sort", () => {
    const { result } = renderSort();

    expect(names(result.current.comparator)).toEqual(["banana", "apple", "cherry"]);
    expect(result.current.sortBy).toBeUndefined();
    expect(result.current.order).toBe(SORT_ORDERS.UNSET);
  });

  it("flips the active column on repeated clicks", () => {
    const { result } = renderSort();

    act(() => result.current.requestSort("name"));
    expect(result.current).toMatchObject({ sortBy: "name", order: SORT_ORDERS.ASC });

    act(() => result.current.requestSort("name"));
    expect(result.current).toMatchObject({ sortBy: "name", order: SORT_ORDERS.DESC });

    act(() => result.current.requestSort("name"));
    expect(result.current).toMatchObject({ sortBy: "name", order: SORT_ORDERS.ASC });
  });

  it("flips a descending default on the first click instead of clearing it", () => {
    const { result } = renderSort({ sortBy: "name", order: SORT_ORDERS.DESC });

    act(() => result.current.requestSort("name"));

    expect(result.current).toMatchObject({ sortBy: "name", order: SORT_ORDERS.ASC });
  });

  it("starts a different column at ASC rather than inheriting the previous order", () => {
    const { result } = renderSort({ sortBy: "name", order: SORT_ORDERS.DESC });

    act(() => result.current.requestSort("rank"));

    expect(result.current).toMatchObject({ sortBy: "rank", order: SORT_ORDERS.ASC });
  });

  it("resets to a new default sort when the caller changes it", () => {
    const { result, rerender } = renderSort({ sortBy: "name", order: SORT_ORDERS.ASC });

    act(() => result.current.requestSort("rank"));
    expect(result.current.sortBy).toBe("rank");

    rerender({ sort: { sortBy: "name", order: SORT_ORDERS.DESC } });

    expect(result.current).toMatchObject({ sortBy: "name", order: SORT_ORDERS.DESC });
  });

  it("drops a user's sort when the column set changes, even if the default is identical", () => {
    // Switching resource kind re-renders K8sResourceListView in place, and every descriptor
    // declares the same default, so nothing but the column set signals the change.
    const defaultSort = { sortBy: "name", order: SORT_ORDERS.ASC } as const;
    const { result, rerender } = renderWithColumns(columns, defaultSort);

    act(() => result.current.requestSort("rank"));
    expect(result.current.sortBy).toBe("rank");

    rerender({ cols: [columns[0]] });

    expect(result.current).toMatchObject({ sortBy: "name", order: SORT_ORDERS.ASC });
  });

  it("keeps a user's sort when the same column set is rebuilt", () => {
    const { result, rerender } = renderWithColumns(columns);

    act(() => result.current.requestSort("rank"));
    rerender({ cols: columns.map((column) => ({ ...column })) });

    expect(result.current.sortBy).toBe("rank");
  });

  it("warns when sortBy names a column that declares no sort key", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const keyless: TableColumn<Row>[] = [
      { id: "actions", label: "Actions", data: { render: () => null }, cell: { baseWidth: 10 } },
    ];

    renderWithColumns(keyless, { sortBy: "actions", order: SORT_ORDERS.ASC });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("no sort key"));
    warn.mockRestore();
  });

  it("does not warn when a column-set change invalidates the user's sort", () => {
    // The reset must land in the same render as the new columns; an effect-based reset
    // would commit one render holding "rank" against a set that no longer declares it.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result, rerender } = renderWithColumns(columns);

    act(() => result.current.requestSort("rank"));
    rerender({ cols: [{ ...columns[0], id: "phase" }] });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("does not clobber a user's sort on re-render with an unchanged default", () => {
    const { result, rerender } = renderSort({ sortBy: "name", order: SORT_ORDERS.ASC });

    act(() => result.current.requestSort("rank"));
    rerender({ sort: { sortBy: "name", order: SORT_ORDERS.ASC } });

    expect(result.current).toMatchObject({ sortBy: "rank", order: SORT_ORDERS.ASC });
  });

  it("sorts nothing while the active column is hidden, and resumes when it is shown again", () => {
    const { result, rerender } = renderWithColumns(columns, { sortBy: "name", order: SORT_ORDERS.ASC });
    expect(names(result.current.comparator)).toEqual(["apple", "banana", "cherry"]);

    rerender({ cols: withVisibility(columns, "name", false) });

    // The choice is kept; only the effect is suspended. No header exists to carry it.
    expect(result.current.sortBy).toBe("name");
    expect(names(result.current.comparator)).toEqual(["banana", "apple", "cherry"]);

    rerender({ cols: withVisibility(columns, "name", true) });

    expect(names(result.current.comparator)).toEqual(["apple", "banana", "cherry"]);
  });

  it("does not warn when the active column is merely hidden", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = renderWithColumns(columns, { sortBy: "name", order: SORT_ORDERS.ASC });

    rerender({ cols: withVisibility(columns, "name", false) });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("keeps the comparator when another column's visibility toggles", () => {
    const { result, rerender } = renderWithColumns(columns, { sortBy: "name", order: SORT_ORDERS.ASC });
    const before = result.current.comparator;

    rerender({ cols: withVisibility(columns, "rank", false) });

    expect(result.current.comparator).toBe(before);
  });

  it("ranks pinned rows first in both directions", () => {
    const pinCherry = (row: Row) => row.metadata.name === "cherry";
    const { result } = renderWithColumns(columns, { sortBy: "name", order: SORT_ORDERS.ASC }, pinCherry);
    expect(names(result.current.comparator)).toEqual(["cherry", "apple", "banana"]);

    act(() => result.current.requestSort("name"));

    expect(result.current.order).toBe(SORT_ORDERS.DESC);
    expect(names(result.current.comparator)).toEqual(["cherry", "banana", "apple"]);
  });
});
