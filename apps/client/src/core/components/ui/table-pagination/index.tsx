import * as React from "react";
import { Button } from "@/core/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/core/utils/classname";

export interface TablePaginationProps {
  dataCount: number | null;
  rowsPerPage: number;
  page: number;
  handleChangePage: (event: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rowsPerPageOptions?: number[];
  labelRowsPerPage?: string;
  className?: string;
}

export const TablePagination = ({
  dataCount,
  rowsPerPage,
  page,
  handleChangePage,
  handleChangeRowsPerPage,
  rowsPerPageOptions = [10, 20, 50, 100],
  labelRowsPerPage = "Rows per page:",
  className,
}: TablePaginationProps) => {
  const count = dataCount || 0;
  const totalPages = count === 0 ? 0 : Math.ceil(count / rowsPerPage);
  const startRow = count === 0 ? 0 : page * rowsPerPage + 1;
  const endRow = count === 0 ? 0 : Math.min((page + 1) * rowsPerPage, count);

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
    handleChangePage(event, Math.max(0, totalPages - 1));
  };

  const handleRowsPerPageChange = (value: string) => {
    // Create a synthetic event to match the expected signature
    const syntheticEvent = {
      target: { value },
    } as React.ChangeEvent<HTMLInputElement>;
    handleChangeRowsPerPage(syntheticEvent);
    // Reset to first page when changing rows per page
    handleChangePage(null, 0);
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
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

      <div className="flex items-center gap-6">
        <div className="text-muted-foreground text-sm">
          {count === 0 ? "0" : `${startRow}-${endRow}`} of {count}
        </div>
        <div className="flex items-center gap-1">
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
            disabled={totalPages === 0 || page >= totalPages - 1}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleLastPage}
            disabled={totalPages === 0 || page >= totalPages - 1}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
