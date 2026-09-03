import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useColumnResize } from "./useColumnResize";
import { TableColumn } from "../types";
import { TABLE_WIDTH_DEFAULTS } from "../constants";
import { Row, column, readTableSettings, seedTableSettings } from "../testUtils";
import { useIsNarrow } from "@/core/hooks/use-narrow";
import { TABLE_CONTAINER_SLOT } from "@/core/components/ui/table/constants";
import { stubResizeObserver } from "@/test/utils/resize-observer";

// Wide by default; individual cases opt into narrow.
vi.mock("@/core/hooks/use-narrow", () => ({ useIsNarrow: vi.fn(() => false) }));

/** Sums to 100, so a seed at the floor basis is easy to reason about. */
const columns = [column("name", 40), column("status", 20), column("branch", 20), column("actions", 20)];

const TABLE_ID = "resizeTest";

/**
 * `renderHook` renders no `<col>`, so the container the hook measures has to be built
 * by hand and fed through the ref callbacks. `closest()` walks detached trees fine.
 */
const buildTable = (clientWidth: number) => {
  const container = document.createElement("div");
  container.setAttribute("data-slot", TABLE_CONTAINER_SLOT);
  const table = document.createElement("table");
  const colgroup = document.createElement("colgroup");
  container.appendChild(table);
  table.appendChild(colgroup);
  Object.defineProperty(container, "clientWidth", { value: clientWidth, configurable: true });
  return { container, colgroup };
};

let resizeObserver: ReturnType<typeof stubResizeObserver>;

const attachCols = (
  api: { getColProps: (id: string) => { ref: (node: HTMLTableColElement | null) => void } },
  colgroup: HTMLElement,
  ids: string[]
) => {
  for (const id of ids) {
    const col = document.createElement("col");
    colgroup.appendChild(col);
    api.getColProps(id).ref(col);
  }
};

const setContainerWidth = (container: HTMLElement, width: number) => {
  Object.defineProperty(container, "clientWidth", { value: width, configurable: true });
  for (const callback of resizeObserver.callbacks) {
    callback([], {} as ResizeObserver);
  }
};

const renderResize = (overrides: Partial<Parameters<typeof useColumnResize<Row>>[0]> = {}) =>
  renderHook(() => useColumnResize<Row>({ tableId: TABLE_ID, columns, ...overrides }));

describe("useColumnResize", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useIsNarrow).mockReturnValue(false);
    resizeObserver = stubResizeObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.className = "";
  });

  describe("seeding", () => {
    it("gives every visible column a width", () => {
      const { result } = renderResize();

      for (const { id } of columns) {
        expect(result.current.getColProps(id).style.width).toBeGreaterThan(0);
      }
    });

    it("seeds at the floor basis before the container is measured", () => {
      const { result } = renderResize();

      expect(result.current.getColProps("name").style.width).toBe(544);
    });

    it("scales to the measured container width", () => {
      const { container, colgroup } = buildTable(2200);
      const { result } = renderResize();

      act(() => attachCols(result.current, colgroup, ["name"]));

      expect(container.clientWidth).toBe(2200);
      expect(result.current.getColProps("name").style.width).toBe(880);
    });

    it("subtracts the leading columns from the available width", () => {
      const { result } = renderResize({ showExpandColumn: true, showSelectionColumn: true });

      expect(result.current.getColProps("name").style.width).toBe(512);
    });
  });

  describe("persisted widths", () => {
    it("applies a persisted width on mount", () => {
      seedTableSettings({ [TABLE_ID]: { name: { id: "name", width: 700 } } });

      const { result } = renderResize();

      expect(result.current.getColProps("name").style.width).toBe(700);
    });

    it("starts pinned, so reset is offered immediately", () => {
      seedTableSettings({ [TABLE_ID]: { name: { id: "name", width: 700 } } });

      const { result } = renderResize();

      expect(result.current.reset.isAvailable).toBe(true);
    });

    it("does not re-seed a persisted width when the container changes", () => {
      seedTableSettings({ [TABLE_ID]: { name: { id: "name", width: 700 } } });
      const { container, colgroup } = buildTable(1360);
      const { result } = renderResize();

      act(() => attachCols(result.current, colgroup, ["name", "status"]));
      const before = result.current.getColProps("status").style.width;

      act(() => setContainerWidth(container, 2200));

      expect(result.current.getColProps("name").style.width).toBe(700);
      expect(result.current.getColProps("status").style.width).not.toBe(before);
    });
  });

  describe("getResizerProps", () => {
    it("returns handlers for an ordinary column, including the last one", () => {
      const { result } = renderResize();

      expect(result.current.getResizerProps("actions")).not.toBeNull();
    });

    it("returns null for opted-out, hidden and spanning columns", () => {
      const { result } = renderResize({
        columns: [
          column("a", 25, { resizable: false }),
          column("b", 25, { show: false }),
          column("c", 25, { props: { colSpan: 2 } }),
          column("d", 25),
        ],
      });

      expect(result.current.getResizerProps("a")).toBeNull();
      expect(result.current.getResizerProps("b")).toBeNull();
      expect(result.current.getResizerProps("c")).toBeNull();
      expect(result.current.getResizerProps("d")).not.toBeNull();
    });

    it("returns null for an unknown column", () => {
      const { result } = renderResize();

      expect(result.current.getResizerProps("ghost")).toBeNull();
    });

    it("returns null for every column on a narrow viewport", () => {
      vi.mocked(useIsNarrow).mockReturnValue(true);
      const { result } = renderResize();

      for (const { id } of columns) {
        expect(result.current.getResizerProps(id)).toBeNull();
      }
    });

    it("still applies widths on a narrow viewport, so the table scrolls sideways", () => {
      vi.mocked(useIsNarrow).mockReturnValue(true);
      const { result } = renderResize();

      expect(result.current.getColProps("name").style.width).toBe(544);
    });
  });

  describe("getColProps identity", () => {
    // Guards the memo bail-out: if this never changes, no reset or re-seed reaches the DOM.
    it("changes when widths change", () => {
      const { container, colgroup } = buildTable(1360);
      const { result } = renderResize();

      act(() => attachCols(result.current, colgroup, ["name"]));
      const before = result.current.getColProps;

      act(() => setContainerWidth(container, 2200));

      expect(result.current.getColProps).not.toBe(before);
    });
  });

  describe("hidden columns", () => {
    it("redistributes a hidden column's share", () => {
      const { result: shown } = renderResize();
      const { result: hidden } = renderResize({
        columns: [
          column("name", 40),
          column("status", 20, { show: false }),
          column("branch", 20),
          column("actions", 20),
        ],
      });

      expect(hidden.current.getColProps("name").style.width).toBeGreaterThan(
        shown.current.getColProps("name").style.width as number
      );
    });
  });

  describe("reset", () => {
    it("is unavailable with nothing persisted", () => {
      expect(renderResize().result.current.reset.isAvailable).toBe(false);
    });

    it("clears every persisted width and unpins", () => {
      seedTableSettings({ [TABLE_ID]: { name: { id: "name", show: false, width: 700 } } });
      const { result } = renderResize();

      act(() => result.current.reset.all());

      expect(result.current.reset.isAvailable).toBe(false);
      expect(result.current.getColProps("name").style.width).toBe(544);
      // `show` survives; only widths are cleared.
      expect(readTableSettings()[TABLE_ID].name).toEqual({ id: "name", show: false });
    });

    it("prunes a persisted width for a column that no longer exists", () => {
      seedTableSettings({ [TABLE_ID]: { ghost: { id: "ghost", width: 700 } } });
      const { result } = renderResize();

      act(() => result.current.reset.all());

      expect(readTableSettings()[TABLE_ID]).toBeUndefined();
    });

    it("restores one column and leaves the others", () => {
      seedTableSettings({ [TABLE_ID]: { name: { id: "name", width: 700 }, status: { id: "status", width: 300 } } });
      const { result } = renderResize();

      act(() => result.current.getResizerProps("name")!.onDoubleClick());

      expect(result.current.getColProps("status").style.width).toBe(300);
      expect(result.current.getColProps("name").style.width).not.toBe(700);
      expect(result.current.reset.isAvailable).toBe(true);
    });
  });

  describe("pin lifecycle", () => {
    const renderSwitchable = (tableId: string, cols: TableColumn<Row>[]) =>
      renderHook(
        ({ id, columns: c }: { id: string; columns: TableColumn<Row>[] }) =>
          useColumnResize<Row>({ tableId: id, columns: c }),
        {
          initialProps: { id: tableId, columns: cols },
        }
      );

    it("re-seeds from the new table's saved settings when tableId changes", () => {
      seedTableSettings({ tableA: { name: { id: "name", width: 900 } }, tableB: {} });
      const { result, rerender } = renderSwitchable("tableA", columns);

      expect(result.current.getColProps("name").style.width).toBe(900);
      expect(result.current.reset.isAvailable).toBe(true);

      rerender({ id: "tableB", columns });

      // Table A's pin must not follow the hook to table B.
      expect(result.current.getColProps("name").style.width).toBe(544);
      expect(result.current.reset.isAvailable).toBe(false);
    });

    it("re-reads a shared column's persisted width when tableId changes", () => {
      seedTableSettings({
        tableA: { name: { id: "name", width: 900 } },
        tableB: { name: { id: "name", width: 300 } },
      });
      const { result, rerender } = renderSwitchable("tableA", columns);

      rerender({ id: "tableB", columns });

      // Same column id, other table: the session width from table A must not win.
      expect(result.current.getColProps("name").style.width).toBe(300);
    });

    it("restores a persisted width when navigating back to a table", () => {
      seedTableSettings({ tableA: { name: { id: "name", width: 900 } } });
      const { result, rerender } = renderSwitchable("tableA", columns);

      rerender({ id: "tableB", columns });
      expect(result.current.getColProps("name").style.width).toBe(544);

      rerender({ id: "tableA", columns });

      expect(result.current.getColProps("name").style.width).toBe(900);
      expect(result.current.reset.isAvailable).toBe(true);
    });

    it("drops ids that leave the column set", () => {
      seedTableSettings({ [TABLE_ID]: { name: { id: "name", width: 900 } } });
      const { result, rerender } = renderSwitchable(TABLE_ID, columns);

      expect(result.current.reset.isAvailable).toBe(true);

      rerender({ id: TABLE_ID, columns: columns.filter((c) => c.id !== "name") });

      // Nothing on screen is resized any more, so the reset action must go quiet.
      expect(result.current.reset.isAvailable).toBe(false);
    });

    it("keeps a pin when the column is only hidden", () => {
      seedTableSettings({ [TABLE_ID]: { name: { id: "name", width: 900 } } });
      const { result, rerender } = renderSwitchable(TABLE_ID, columns);

      rerender({
        id: TABLE_ID,
        columns: columns.map((c) => (c.id === "name" ? column("name", 40, { show: false }) : c)),
      });

      expect(result.current.reset.isAvailable).toBe(true);
      expect(result.current.getColProps("name").style.width).toBe(900);
    });

    it("keeps pins for surviving columns when the column set changes", () => {
      seedTableSettings({ [TABLE_ID]: { name: { id: "name", width: 900 }, status: { id: "status", width: 300 } } });
      const { result, rerender } = renderSwitchable(TABLE_ID, columns);

      rerender({ id: TABLE_ID, columns: columns.filter((c) => c.id !== "status") });

      expect(result.current.getColProps("name").style.width).toBe(900);
      expect(result.current.reset.isAvailable).toBe(true);
    });
  });

  describe("dragging", () => {
    /** jsdom has no PointerEvent; the handlers only read `clientX`, which MouseEvent carries. */
    const pointerDownOn = (
      api: { getResizerProps: (id: string) => { onPointerDown: (event: never) => void } | null },
      columnId: string,
      clientX: number
    ) =>
      api.getResizerProps(columnId)!.onPointerDown({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        currentTarget: { setPointerCapture: vi.fn() },
        clientX,
        pointerId: 1,
      } as never);

    const movePointer = (clientX: number) =>
      document.dispatchEvent(new MouseEvent("pointermove", { clientX, bubbles: true }));

    const releasePointer = () => document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));

    /** A full gesture in one act. Tests that assert mid-drag drive the three steps themselves. */
    const drag = (api: Parameters<typeof pointerDownOn>[0], columnId: string, byPixels: number) =>
      act(() => {
        pointerDownOn(api, columnId, 0);
        movePointer(byPixels);
        releasePointer();
      });

    it("clamps a drag to MAX in the DOM, in state and in storage", () => {
      const { colgroup } = buildTable(1360);
      const { result } = renderResize();

      act(() => attachCols(result.current, colgroup, ["name"]));
      const col = colgroup.firstElementChild as HTMLTableColElement;

      drag(result.current, "name", 99999);

      expect(col.style.width).toBe(`${TABLE_WIDTH_DEFAULTS.MAX}px`);
      expect(result.current.getColProps("name").style.width).toBe(TABLE_WIDTH_DEFAULTS.MAX);
      expect(readTableSettings()[TABLE_ID].name.width).toBe(TABLE_WIDTH_DEFAULTS.MAX);
    });

    it("clamps a drag to the column floor", () => {
      const { colgroup } = buildTable(1360);
      const { result } = renderResize();

      act(() => attachCols(result.current, colgroup, ["name"]));

      drag(result.current, "name", -99999);

      expect(result.current.getColProps("name").style.width).toBe(TABLE_WIDTH_DEFAULTS.MIN);
    });

    it("keeps the live dragged width when the container changes mid-drag", () => {
      const { container, colgroup } = buildTable(1360);
      const { result } = renderResize();

      act(() => attachCols(result.current, colgroup, ["name", "status", "branch", "actions"]));

      act(() => {
        pointerDownOn(result.current, "name", 0);
        movePointer(200);
      });

      // A watch pushing rows flips the selection column, or the sidebar collapses.
      act(() => setContainerWidth(container, 2200));

      expect(result.current.getColProps("name").style.width).toBe(744);

      act(() => releasePointer());

      expect(result.current.getColProps("name").style.width).toBe(744);
    });

    it("does not mutate the widths state object during a drag", () => {
      const { colgroup } = buildTable(1360);
      const { result } = renderResize();

      act(() => attachCols(result.current, colgroup, ["name"]));
      const before = result.current.getColProps("name").style.width;

      act(() => {
        pointerDownOn(result.current, "name", 0);
        movePointer(200);
      });

      // Still the committed width until pointerup; only the DOM moved.
      expect(result.current.getColProps("name").style.width).toBe(before);

      act(() => releasePointer());

      expect(result.current.getColProps("name").style.width).toBe(744);
    });

    it("clears the resizing body class on pointerup", () => {
      const { colgroup } = buildTable(1360);
      const { result } = renderResize();

      act(() => attachCols(result.current, colgroup, ["name"]));

      act(() => pointerDownOn(result.current, "name", 0));
      // Literal on purpose: must match the `.krci-resizing *` rule in tailwind.css.
      expect(document.body.classList.contains("krci-resizing")).toBe(true);

      act(() => releasePointer());
      expect(document.body.classList.contains("krci-resizing")).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("disconnects the observer on unmount", () => {
      const { colgroup } = buildTable(1360);
      const { result, unmount } = renderResize();

      act(() => attachCols(result.current, colgroup, ["name"]));
      expect(resizeObserver.instances).toHaveLength(1);

      unmount();

      expect(resizeObserver.disconnect).toHaveBeenCalled();
    });

    it("observes the container once even when several cols attach", () => {
      const { colgroup } = buildTable(1360);
      const { result } = renderResize();

      act(() => attachCols(result.current, colgroup, ["name", "status", "branch", "actions"]));

      expect(resizeObserver.instances).toHaveLength(1);
    });
  });
});
