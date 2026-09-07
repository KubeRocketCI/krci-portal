import * as React from "react";
import { Button } from "@/core/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/core/utils/classname";
import { isKnownTotal } from "./utils";

export interface TablePaginationProps {
  /** Size of the result set. `undefined` while it loads; a value that fails `isKnownTotal` reads the same way. */
  totalCount: number | undefined;
  /** Cursor-based APIs report this instead of a total. Ignored when `totalCount` is a known total. */
  hasNextPage?: boolean;
  /** Row count of the visible page. Sizes the range label when there is no total. */
  pageItemCount: number;
  rowsPerPage: number;
  page: number;
  handleChangePage: (event: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rowsPerPageOptions?: number[];
  labelRowsPerPage?: string;
  /** Renders the rows-per-page select. Defaults to `true`. Set `false` when the page size is not controllable. */
  showRowsPerPage?: boolean;
  className?: string;
}

/**
 * `known`: `totalCount` passes `isKnownTotal`. `cursor`: only `hasNextPage` is set. `loading`: neither.
 * Known total wins when both arrive.
 */
type PagerState = "known" | "loading" | "cursor";

interface PagerView {
  state: PagerState;
  rangeLabel: string;
  nextDisabled: boolean;
  lastDisabled: boolean;
  lastPageIndex: number;
}

const resolvePagerView = ({
  totalCount,
  hasNextPage,
  pageItemCount,
  page,
  rowsPerPage,
}: Pick<TablePaginationProps, "totalCount" | "hasNextPage" | "pageItemCount" | "page" | "rowsPerPage">): PagerView => {
  if (isKnownTotal(totalCount)) {
    const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / rowsPerPage);
    const startRow = totalCount === 0 ? 0 : page * rowsPerPage + 1;
    const endRow = totalCount === 0 ? 0 : Math.min((page + 1) * rowsPerPage, totalCount);
    const onLastPage = totalPages === 0 || page >= totalPages - 1;

    return {
      state: "known",
      rangeLabel: totalCount === 0 ? "0 of 0" : `${startRow}-${endRow} of ${totalCount}`,
      nextDisabled: onLastPage,
      lastDisabled: onLastPage,
      lastPageIndex: Math.max(0, totalPages - 1),
    };
  }

  if (typeof hasNextPage === "boolean") {
    const startRow = pageItemCount === 0 ? 0 : page * rowsPerPage + 1;
    const endRow = startRow + pageItemCount - 1;

    return {
      state: "cursor",
      rangeLabel: pageItemCount === 0 ? "0" : `${startRow}-${endRow} of many`,
      nextDisabled: hasNextPage !== true,
      lastDisabled: true,
      lastPageIndex: 0,
    };
  }

  return {
    state: "loading",
    rangeLabel: "…",
    nextDisabled: true,
    lastDisabled: true,
    lastPageIndex: 0,
  };
};

export const TablePagination = ({
  totalCount,
  hasNextPage,
  pageItemCount,
  rowsPerPage,
  page,
  handleChangePage,
  handleChangeRowsPerPage,
  rowsPerPageOptions = [10, 20, 50, 100],
  labelRowsPerPage = "Rows per page:",
  showRowsPerPage = true,
  className,
}: TablePaginationProps) => {
  const view = resolvePagerView({ totalCount, hasNextPage, pageItemCount, page, rowsPerPage });
  // A cursor API has no last page, so the jump buttons have nothing to jump to.
  const showEdgeButtons = view.state !== "cursor";

  const handleFirstPage = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleChangePage(event, 0);
  };

  const handlePreviousPage = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleChangePage(event, page - 1);
  };

  const handleNextPage = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleChangePage(event, page + 1);
  };

  const handleLastPage = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleChangePage(event, view.lastPageIndex);
  };

  // The size callback resets the page. The pager emits the new size only.
  const handleRowsPerPageChange = (value: string) => {
    const syntheticEvent = {
      target: { value },
    } as React.ChangeEvent<HTMLInputElement>;
    handleChangeRowsPerPage(syntheticEvent);
  };

  return (
    <div className={cn("flex items-center", showRowsPerPage ? "justify-between" : "justify-end", className)}>
      {showRowsPerPage && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{labelRowsPerPage}</span>
          <Select value={String(rowsPerPage)} onValueChange={handleRowsPerPageChange}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rowsPerPageOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-6">
        <div className="text-muted-foreground text-sm" data-testid="table-pagination-range">
          {view.rangeLabel}
        </div>
        <div className="flex items-center gap-1">
          {showEdgeButtons && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleFirstPage}
              disabled={page === 0}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handlePreviousPage}
            disabled={page === 0}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleNextPage}
            disabled={view.nextDisabled}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {showEdgeButtons && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleLastPage}
              disabled={view.lastDisabled}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
