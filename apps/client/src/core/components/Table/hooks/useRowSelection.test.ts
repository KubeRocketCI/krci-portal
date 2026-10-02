import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { describe, expect, it } from "vitest";
import { useRowSelection } from "./useRowSelection";

interface Row {
  id: string;
}

const getRowId = (row: Row) => row.id;
const rows: Row[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
const clickEvent = {} as React.MouseEvent<HTMLButtonElement>;
const selectPage = { target: { checked: true } } as React.ChangeEvent<HTMLInputElement>;
const deselectPage = { target: { checked: false } } as React.ChangeEvent<HTMLInputElement>;

const renderSelection = (initialRows: Row[] = rows) =>
  renderHook(({ data }: { data: Row[] }) => useRowSelection(data, getRowId), {
    initialProps: { data: initialRows },
  });

describe("useRowSelection", () => {
  it("toggles a row", () => {
    const { result } = renderSelection();

    act(() => result.current.selection.handleSelectRow(clickEvent, rows[1]));
    expect(result.current.selection.selected).toEqual(["b"]);
    expect(result.current.selection.isRowSelected(rows[1])).toBe(true);
    expect(result.current.selectedRows).toEqual([rows[1]]);

    act(() => result.current.selection.handleSelectRow(clickEvent, rows[1]));
    expect(result.current.selection.selected).toEqual([]);
  });

  it("adds a page to the selection kept from other pages", () => {
    const { result } = renderSelection();

    act(() => result.current.selection.handleSelectRow(clickEvent, rows[0]));
    act(() => result.current.selection.handleSelectAll(selectPage, [rows[1], rows[2]]));

    expect(result.current.selection.selected).toEqual(["a", "b", "c"]);
  });

  it("removes only the page when the header clears it", () => {
    const { result } = renderSelection();

    act(() => result.current.selection.handleSelectAll(selectPage, rows));
    act(() => result.current.selection.handleSelectAll(deselectPage, [rows[1], rows[2]]));

    expect(result.current.selection.selected).toEqual(["a"]);
  });

  it("drops rows that leave the data from selectedRows", () => {
    const { result, rerender } = renderSelection();

    act(() => result.current.selection.handleSelectAll(selectPage, rows));
    rerender({ data: [rows[0]] });

    expect(result.current.selectedRows).toEqual([rows[0]]);
  });

  it("deselects given rows and keeps the rest", () => {
    const { result } = renderSelection();

    act(() => result.current.selection.handleSelectAll(selectPage, rows));
    act(() => result.current.deselectRows([rows[0], rows[1]]));

    expect(result.current.selectedRows).toEqual([rows[2]]);
  });

  it("clears the selection", () => {
    const { result } = renderSelection();

    act(() => result.current.selection.handleSelectAll(selectPage, rows));
    act(() => result.current.clearSelection());

    expect(result.current.selectedRows).toEqual([]);
  });
});
