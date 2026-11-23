import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable } from "./index";
import { TableColumn } from "./types";

// Reads router state, which this test does not stand up.
vi.mock("@/core/hooks/usePagination", () => ({
  usePagination: vi.fn(() => ({
    page: 0,
    rowsPerPage: 25,
    handleChangePage: vi.fn(),
    handleChangeRowsPerPage: vi.fn(),
  })),
}));

interface Pool {
  name: string;
}

const columns: TableColumn<Pool>[] = [
  {
    id: "name",
    label: "Name",
    data: { render: ({ data }) => data.name },
    cell: { baseWidth: 100 },
  },
];

const data: Pool[] = [{ name: "workers" }, { name: "spare" }];

describe("DataTable - rowProps", () => {
  it("puts the id, aria-current and class of rowProps on the row and keeps the row-click classes", () => {
    render(
      <DataTable<Pool>
        id="rowPropsTest"
        columns={columns}
        data={data}
        pagination={{ show: false }}
        handleRowClick={vi.fn()}
        rowProps={(row) =>
          row.name === "spare" ? { id: "pool-spare", className: "bg-primary/10", "aria-current": "true" } : {}
        }
      />
    );

    const spare = screen.getByRole("radio", { name: /spare/ });
    expect(spare).toHaveAttribute("id", "pool-spare");
    expect(spare).toHaveAttribute("aria-current", "true");
    expect(spare).toHaveClass("bg-primary/10", "cursor-pointer");

    const workers = screen.getByRole("radio", { name: /workers/ });
    expect(workers).not.toHaveAttribute("id");
    expect(workers).not.toHaveAttribute("aria-current");
    expect(workers).toHaveClass("cursor-pointer");
  });
});
