import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ServerSideTable } from "./index";

// Mock components
vi.mock("@/core/components/ui/table", () => ({
  TableUI: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
}));

vi.mock("../Table/components/TableHead", () => ({
  TableHead: () => <thead data-testid="table-head" />,
}));

vi.mock("../Table/components/TableBody", () => ({
  TableBody: ({ emptyListComponent }: { emptyListComponent: React.ReactNode }) => (
    <tbody data-testid="table-body">{emptyListComponent}</tbody>
  ),
}));

vi.mock("../Table/components/TablePagination", () => ({
  TablePagination: () => <div data-testid="pagination" />,
}));

describe("ServerSideTable - Page Out of Bounds", () => {
  const mockColumns = [
    {
      id: "name",
      label: "Name",
      data: {
        render: ({ data }: { data: { name: string } }) => data.name,
      },
      cell: {
        show: true,
        baseWidth: 50,
      },
    },
  ];

  const mockData = [
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" },
    { id: 3, name: "Item 3" },
  ];

  it("should show 'Page not found' message when page is beyond total pages", () => {
    render(
      <ServerSideTable
        id="test-table"
        data={mockData}
        columns={mockColumns}
        pagination={{
          show: true,
          page: 5, // Page 6 (0-indexed) with only 3 items and 25 per page
          rowsPerPage: 25,
          totalCount: 3,
          onPageChange: vi.fn(),
          onRowsPerPageChange: vi.fn(),
        }}
      />
    );

    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(screen.getByText("The requested page does not exist. Please navigate to a valid page.")).toBeInTheDocument();
  });

  it("should NOT show 'Page not found' when page is valid", () => {
    render(
      <ServerSideTable
        id="test-table"
        data={mockData}
        columns={mockColumns}
        pagination={{
          show: true,
          page: 0, // First page
          rowsPerPage: 25,
          totalCount: 3,
          onPageChange: vi.fn(),
          onRowsPerPageChange: vi.fn(),
        }}
      />
    );

    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });

  it("should show 'Page not found' when on page 2 with only 10 total items and 25 per page", () => {
    render(
      <ServerSideTable
        id="test-table"
        data={[]} // Empty because server didn't return data for invalid page
        columns={mockColumns}
        pagination={{
          show: true,
          page: 1, // Page 2 (0-indexed)
          rowsPerPage: 25,
          totalCount: 10, // Only 1 page of data exists
          onPageChange: vi.fn(),
          onRowsPerPageChange: vi.fn(),
        }}
      />
    );

    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("should NOT show error when pagination is disabled", () => {
    render(
      <ServerSideTable
        id="test-table"
        data={mockData}
        columns={mockColumns}
        pagination={{
          show: false,
          page: 99,
          rowsPerPage: 25,
          totalCount: 3,
          onPageChange: vi.fn(),
          onRowsPerPageChange: vi.fn(),
        }}
      />
    );

    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });

  it("should NOT show error when totalCount is 0", () => {
    render(
      <ServerSideTable
        id="test-table"
        data={[]}
        columns={mockColumns}
        pagination={{
          show: true,
          page: 0,
          rowsPerPage: 25,
          totalCount: 0,
          onPageChange: vi.fn(),
          onRowsPerPageChange: vi.fn(),
        }}
      />
    );

    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });

  it("should calculate correct total pages and show error for edge case", () => {
    // 26 items with 25 per page = 2 pages (page 0 and page 1)
    // Page 2 should be out of bounds
    render(
      <ServerSideTable
        id="test-table"
        data={[]}
        columns={mockColumns}
        pagination={{
          show: true,
          page: 2, // Page 3 (0-indexed) - out of bounds
          rowsPerPage: 25,
          totalCount: 26,
          onPageChange: vi.fn(),
          onRowsPerPageChange: vi.fn(),
        }}
      />
    );

    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("should NOT show error when exactly on the last page", () => {
    // 26 items with 25 per page = 2 pages (0-indexed: page 0 and page 1)
    // Page 1 is valid (last page)
    render(
      <ServerSideTable
        id="test-table"
        data={[{ id: 26, name: "Item 26" }]}
        columns={mockColumns}
        pagination={{
          show: true,
          page: 1, // Last valid page
          rowsPerPage: 25,
          totalCount: 26,
          onPageChange: vi.fn(),
          onRowsPerPageChange: vi.fn(),
        }}
      />
    );

    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });

  it("should show custom empty component when provided and not out of bounds", () => {
    const customEmpty = <div data-testid="custom-empty">No data available</div>;

    render(
      <ServerSideTable
        id="test-table"
        data={[]}
        columns={mockColumns}
        emptyListComponent={customEmpty}
        pagination={{
          show: true,
          page: 0,
          rowsPerPage: 25,
          totalCount: 0,
          onPageChange: vi.fn(),
          onRowsPerPageChange: vi.fn(),
        }}
      />
    );

    expect(screen.getByTestId("custom-empty")).toBeInTheDocument();
    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });
});
