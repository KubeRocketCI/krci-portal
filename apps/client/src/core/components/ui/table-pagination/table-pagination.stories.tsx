import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { TablePagination } from "./index";

const meta = {
  title: "Core/UI/TablePagination",
  component: TablePagination,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TablePagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    totalCount: 100,
    pageItemCount: 10,
    page: 0,
    rowsPerPage: 10,
    handleChangePage: () => {},
    handleChangeRowsPerPage: () => {},
  },
  render: () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    return (
      <TablePagination
        totalCount={100}
        pageItemCount={rowsPerPage}
        page={page}
        rowsPerPage={rowsPerPage}
        handleChangePage={(_, newPage) => setPage(newPage)}
        handleChangeRowsPerPage={(e) => setRowsPerPage(Number(e.target.value))}
      />
    );
  },
};

export const LargeDataset: Story = {
  args: {
    totalCount: 1000,
    pageItemCount: 20,
    page: 0,
    rowsPerPage: 20,
    handleChangePage: () => {},
    handleChangeRowsPerPage: () => {},
    rowsPerPageOptions: [20, 50, 100, 200],
  },
  render: () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    return (
      <TablePagination
        totalCount={1000}
        pageItemCount={rowsPerPage}
        page={page}
        rowsPerPage={rowsPerPage}
        handleChangePage={(_, newPage) => setPage(newPage)}
        handleChangeRowsPerPage={(e) => setRowsPerPage(Number(e.target.value))}
        rowsPerPageOptions={[20, 50, 100, 200]}
      />
    );
  },
};

/** No total yet: the range reads `…` and Next and Last stay disabled. */
export const Loading: Story = {
  args: {
    totalCount: undefined,
    pageItemCount: 0,
    page: 0,
    rowsPerPage: 10,
    handleChangePage: () => {},
    handleChangeRowsPerPage: () => {},
  },
};

/** Cursor API: no First and Last; Next follows `hasNextPage`. */
export const Cursor: Story = {
  args: {
    totalCount: undefined,
    hasNextPage: true,
    pageItemCount: 10,
    page: 0,
    rowsPerPage: 10,
    handleChangePage: () => {},
    handleChangeRowsPerPage: () => {},
  },
  render: () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    return (
      <TablePagination
        totalCount={undefined}
        hasNextPage={page < 3}
        pageItemCount={rowsPerPage}
        page={page}
        rowsPerPage={rowsPerPage}
        handleChangePage={(_, newPage) => setPage(newPage)}
        handleChangeRowsPerPage={(e) => setRowsPerPage(Number(e.target.value))}
      />
    );
  },
};
