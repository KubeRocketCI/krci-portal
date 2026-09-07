import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TablePagination, TablePaginationProps } from "./index";

const renderPager = (props: Partial<TablePaginationProps> = {}) => {
  const handleChangePage = vi.fn();
  const handleChangeRowsPerPage = vi.fn();

  render(
    <TablePagination
      totalCount={100}
      pageItemCount={10}
      page={0}
      rowsPerPage={10}
      handleChangePage={handleChangePage}
      handleChangeRowsPerPage={handleChangeRowsPerPage}
      {...props}
    />
  );

  return { handleChangePage, handleChangeRowsPerPage };
};

const range = () => screen.getByTestId("table-pagination-range");
const button = (name: string) => screen.getByRole("button", { name });
const queryButton = (name: string) => screen.queryByRole("button", { name });

describe("TablePagination", () => {
  it("known total: renders start-end of total", () => {
    renderPager({ totalCount: 100, page: 0, rowsPerPage: 10, pageItemCount: 10 });

    expect(range()).toHaveTextContent("1-10 of 100");
  });

  it("known total: renders 0 of 0 for an empty total", () => {
    renderPager({ totalCount: 0, pageItemCount: 0 });

    expect(range()).toHaveTextContent("0 of 0");
    expect(button("Next page")).toBeDisabled();
    expect(button("Last page")).toBeDisabled();
  });

  it("loading: renders an ellipsis and disables Next and Last", () => {
    renderPager({ totalCount: undefined, pageItemCount: 0 });

    expect(range()).toHaveTextContent("…");
    expect(button("Next page")).toBeDisabled();
    expect(button("Last page")).toBeDisabled();
    expect(button("First page")).toBeDisabled();
    expect(button("Previous page")).toBeDisabled();
  });

  it.each([-1, NaN, Infinity, 10.5])("treats totalCount %s as loading", (totalCount) => {
    renderPager({ totalCount, pageItemCount: 10 });

    expect(range()).toHaveTextContent("…");
    expect(button("Next page")).toBeDisabled();
    expect(button("Last page")).toBeDisabled();
  });

  it("cursor: renders start-end of many and hides First and Last", () => {
    renderPager({ totalCount: undefined, hasNextPage: true, page: 1, rowsPerPage: 10, pageItemCount: 7 });

    expect(range()).toHaveTextContent("11-17 of many");
    expect(queryButton("First page")).toBeNull();
    expect(queryButton("Last page")).toBeNull();
    expect(button("Previous page")).toBeEnabled();
  });

  it("cursor: enables Next only when hasNextPage is true", () => {
    const { unmount } = render(
      <TablePagination
        totalCount={undefined}
        hasNextPage
        pageItemCount={10}
        page={0}
        rowsPerPage={10}
        handleChangePage={vi.fn()}
        handleChangeRowsPerPage={vi.fn()}
      />
    );
    expect(button("Next page")).toBeEnabled();
    unmount();

    render(
      <TablePagination
        totalCount={undefined}
        hasNextPage={false}
        pageItemCount={10}
        page={0}
        rowsPerPage={10}
        handleChangePage={vi.fn()}
        handleChangeRowsPerPage={vi.fn()}
      />
    );
    expect(button("Next page")).toBeDisabled();
  });

  it("prefers the known total when both totalCount and hasNextPage are set", () => {
    renderPager({ totalCount: 100, hasNextPage: false, pageItemCount: 10 });

    expect(range()).toHaveTextContent("1-10 of 100");
    expect(button("Next page")).toBeEnabled();
    expect(button("Last page")).toBeEnabled();
  });

  it("rows-per-page change calls handleChangeRowsPerPage once and never handleChangePage", async () => {
    const user = userEvent.setup();
    const { handleChangePage, handleChangeRowsPerPage } = renderPager({ page: 3 });

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "20" }));

    expect(handleChangeRowsPerPage).toHaveBeenCalledTimes(1);
    expect(handleChangeRowsPerPage).toHaveBeenCalledWith({ target: { value: "20" } });
    expect(handleChangePage).not.toHaveBeenCalled();
  });

  it("hides the rows-per-page select when showRowsPerPage is false", () => {
    renderPager({ showRowsPerPage: false });

    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByText("Rows per page:")).toBeNull();
    expect(range()).toHaveTextContent("1-10 of 100");
  });

  it("First page calls handleChangePage with 0", async () => {
    const user = userEvent.setup();
    const { handleChangePage } = renderPager({ page: 3 });

    await user.click(button("First page"));

    expect(handleChangePage).toHaveBeenCalledTimes(1);
    expect(handleChangePage).toHaveBeenCalledWith(expect.anything(), 0);
  });

  it("Previous page calls handleChangePage with page - 1", async () => {
    const user = userEvent.setup();
    const { handleChangePage } = renderPager({ page: 3 });

    await user.click(button("Previous page"));

    expect(handleChangePage).toHaveBeenCalledTimes(1);
    expect(handleChangePage).toHaveBeenCalledWith(expect.anything(), 2);
  });

  it("Next page calls handleChangePage with page + 1", async () => {
    const user = userEvent.setup();
    const { handleChangePage } = renderPager({ page: 3 });

    await user.click(button("Next page"));

    expect(handleChangePage).toHaveBeenCalledTimes(1);
    expect(handleChangePage).toHaveBeenCalledWith(expect.anything(), 4);
  });

  it("Last page calls handleChangePage with the last page index", async () => {
    const user = userEvent.setup();
    const { handleChangePage } = renderPager({ totalCount: 45, rowsPerPage: 10, page: 0 });

    await user.click(button("Last page"));

    expect(handleChangePage).toHaveBeenCalledTimes(1);
    expect(handleChangePage).toHaveBeenCalledWith(expect.anything(), 4);
  });

  it("cursor: Next calls handleChangePage with page + 1 and First/Last are absent", async () => {
    const user = userEvent.setup();
    const { handleChangePage } = renderPager({ totalCount: undefined, hasNextPage: true, page: 1 });

    expect(queryButton("First page")).toBeNull();
    expect(queryButton("Last page")).toBeNull();

    await user.click(button("Next page"));

    expect(handleChangePage).toHaveBeenCalledTimes(1);
    expect(handleChangePage).toHaveBeenCalledWith(expect.anything(), 2);
  });
});
