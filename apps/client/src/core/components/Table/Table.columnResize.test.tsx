import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "./index";
import { TABLE_WIDTH_DEFAULTS } from "./constants";
import { TableColumn } from "./types";
import { COLUMN_RESIZER_SLOT } from "./components/ColumnResizer";
import { readTableSettings, seedTableSettings } from "./testUtils";
import { stubResizeObserver } from "@/test/utils/resize-observer";

/**
 * DOM-level coverage of the commit path: asserts on `<col>` style, not hook state.
 * Guards the `TableColgroup` memo bail-out.
 */

// Reads router state, which this test does not stand up.
vi.mock("@/core/hooks/usePagination", () => ({
  usePagination: vi.fn(() => ({
    page: 0,
    rowsPerPage: 25,
    handleChangePage: vi.fn(),
    handleChangeRowsPerPage: vi.fn(),
  })),
}));

const TABLE_ID = "commitTest";
const HANDLE_SELECTOR = `th [data-slot="${COLUMN_RESIZER_SLOT}"]`;

type Row = { name: string };

const columns: TableColumn<Row>[] = [
  { id: "name", label: "Name", data: { render: ({ data }) => data.name }, cell: { baseWidth: 40 } },
  { id: "status", label: "Status", data: { render: () => "ok" }, cell: { baseWidth: 30 } },
  { id: "actions", label: "Actions", data: { render: () => "..." }, cell: { baseWidth: 30 } },
];

const data: Row[] = [{ name: "alpha" }, { name: "beta" }];

const renderTable = () =>
  render(<DataTable<Row> id={TABLE_ID} columns={columns} data={data} pagination={{ show: false }} />);

const colFor = (container: HTMLElement, index: number) =>
  container.querySelectorAll("col")[index] as HTMLTableColElement;

const handleFor = (container: HTMLElement, index: number) =>
  container.querySelectorAll(HANDLE_SELECTOR)[index] as HTMLElement;

const dragHandle = (handle: HTMLElement, byPixels: number) => {
  act(() => {
    handle.dispatchEvent(new MouseEvent("pointerdown", { clientX: 0, bubbles: true }));
  });
  act(() => {
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: byPixels, bubbles: true }));
    document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
  });
};

describe("column resize commit path", () => {
  beforeEach(() => {
    localStorage.clear();
    stubResizeObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.className = "";
  });

  it("renders one <col> per visible column plus a handle in each header", () => {
    const { container } = renderTable();

    expect(container.querySelectorAll("col")).toHaveLength(3);
    // Every column is resizable, including the last.
    expect(container.querySelectorAll(HANDLE_SELECTOR)).toHaveLength(3);
  });

  it("gives every <col> an explicit width", () => {
    const { container } = renderTable();

    for (let index = 0; index < 3; index += 1) {
      expect(colFor(container, index).style.width).not.toBe("");
    }
  });

  it("moves the <col> and persists the width on drag", () => {
    const { container } = renderTable();
    const before = parseInt(colFor(container, 0).style.width, 10);

    dragHandle(handleFor(container, 0), 150);

    expect(parseInt(colFor(container, 0).style.width, 10)).toBe(before + 150);
    expect(readTableSettings()[TABLE_ID].name.width).toBe(before + 150);
  });

  it("restores the <col> in the DOM on double-click", () => {
    const { container } = renderTable();
    const before = colFor(container, 0).style.width;

    dragHandle(handleFor(container, 0), 150);
    expect(colFor(container, 0).style.width).not.toBe(before);

    act(() => {
      handleFor(container, 0).dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    });

    // The regression guard for the memo bail-out: state changed, so the DOM must follow.
    expect(colFor(container, 0).style.width).toBe(before);
    expect(readTableSettings()[TABLE_ID]).toBeUndefined();
  });

  it("clamps a drag to the column floor", () => {
    const { container } = renderTable();

    dragHandle(handleFor(container, 0), -99999);

    expect(parseInt(colFor(container, 0).style.width, 10)).toBe(TABLE_WIDTH_DEFAULTS.MIN);
  });

  it("applies a persisted width on mount", () => {
    seedTableSettings({ [TABLE_ID]: { name: { id: "name", width: 777 } } });

    const { container } = renderTable();

    expect(colFor(container, 0).style.width).toBe("777px");
  });

  it("restores every <col> from the Columns dropdown", async () => {
    const user = userEvent.setup();
    const { container } = renderTable();
    const before = [0, 1, 2].map((index) => colFor(container, index).style.width);

    dragHandle(handleFor(container, 0), 150);
    dragHandle(handleFor(container, 1), 90);
    expect(colFor(container, 0).style.width).not.toBe(before[0]);

    await user.click(screen.getByRole("button", { name: /columns/i }));
    await user.click(await screen.findByText("Reset column widths"));

    expect([0, 1, 2].map((index) => colFor(container, index).style.width)).toEqual(before);
    expect(readTableSettings()[TABLE_ID]).toBeUndefined();
  });

  it("disables the reset item until a column has been resized", async () => {
    const user = userEvent.setup();
    const { container } = renderTable();

    await user.click(screen.getByRole("button", { name: /columns/i }));
    expect(await screen.findByText("Reset column widths")).toHaveAttribute("aria-disabled", "true");

    await user.keyboard("{Escape}");
    dragHandle(handleFor(container, 0), 150);

    await user.click(screen.getByRole("button", { name: /columns/i }));
    expect(await screen.findByText("Reset column widths")).not.toHaveAttribute("aria-disabled", "true");
  });

  it("toggles the resizing class on the body for the duration of a drag", () => {
    const { container } = renderTable();
    const handle = handleFor(container, 0);

    act(() => {
      handle.dispatchEvent(new MouseEvent("pointerdown", { clientX: 0, bubbles: true }));
    });
    // Literal on purpose: must match the `.krci-resizing *` rule in tailwind.css.
    expect(document.body.classList.contains("krci-resizing")).toBe(true);

    act(() => {
      document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    });
    expect(document.body.classList.contains("krci-resizing")).toBe(false);
  });
});
