import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "./index";
import { Row, colFor, column, dragHandle, handleFor, readTableSettings, seedTableSettings } from "./testUtils";
import { stubResizeObserver } from "@/test/utils/resize-observer";

/**
 * DOM-level coverage of saved visibility: asserts on `<th>` presence through the real
 * shell and the real Columns dropdown, with no page-level `getSyncedColumnData` wiring.
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

const TABLE_ID = "visibilityTest";

const columns = [column("name", 40), column("status", 30), column("actions", 30)];

const data: Row[] = [{ name: "alpha" }, { name: "beta" }];

const renderTable = (props: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}) =>
  render(<DataTable<Row> id={TABLE_ID} columns={columns} data={data} pagination={{ show: false }} {...props} />);

const statusHeader = () => screen.queryByRole("columnheader", { name: /status/i });

const hideStatusFromDropdown = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /columns/i }));
  await user.click(await screen.findByRole("menuitemcheckbox", { name: /^status$/i }));
};

describe("column visibility restore path", () => {
  beforeEach(() => {
    localStorage.clear();
    stubResizeObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.className = "";
  });

  it("hides a column with a saved show:false on the first render", () => {
    seedTableSettings({ [TABLE_ID]: { status: { id: "status", show: false } } });

    const { container } = renderTable();

    expect(statusHeader()).toBeNull();
    expect(container.querySelectorAll("col")).toHaveLength(2);
  });

  it("keeps a column hidden from the dropdown across a remount", async () => {
    const user = userEvent.setup();
    const first = renderTable();
    expect(statusHeader()).not.toBeNull();

    await hideStatusFromDropdown(user);

    expect(statusHeader()).toBeNull();
    expect(readTableSettings()[TABLE_ID].status).toEqual({ id: "status", show: false });

    first.unmount();
    renderTable();

    expect(statusHeader()).toBeNull();
  });

  it("restores a hidden column and a resized column together across a remount", async () => {
    const user = userEvent.setup();
    const first = renderTable();

    await hideStatusFromDropdown(user);
    // Measured after the hide: the hidden column's share has already moved to the others.
    const nameWidthBefore = parseInt(colFor(first.container, 0).style.width, 10);
    dragHandle(handleFor(first.container, 0), 150);

    expect(readTableSettings()[TABLE_ID]).toEqual({
      status: { id: "status", show: false },
      name: { id: "name", width: nameWidthBefore + 150 },
    });

    first.unmount();
    const second = renderTable();

    expect(statusHeader()).toBeNull();
    expect(colFor(second.container, 0).style.width).toBe(`${nameWidthBefore + 150}px`);
  });

  it("restores a saved hidden column on a table with no Columns dropdown", () => {
    seedTableSettings({ [TABLE_ID]: { status: { id: "status", show: false } } });

    renderTable({ settings: { show: false } });

    expect(screen.queryByRole("button", { name: /columns/i })).toBeNull();
    expect(statusHeader()).toBeNull();
  });
});
