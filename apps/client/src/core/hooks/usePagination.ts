import { useCallback, ChangeEvent } from "react";
import { useSearch } from "@tanstack/react-router";
import { router } from "@/core/router";

interface UsePaginationProps {
  initialPage: number;
  initialRowsPerPage: number;
}

interface UsePaginationReturn {
  page: number;
  rowsPerPage: number;
  handleChangePage: (_event: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function usePagination({ initialPage, initialRowsPerPage }: UsePaginationProps): UsePaginationReturn {
  const search = useSearch({ strict: false }) as { page?: number; rowsPerPage?: number };

  // Get default rowsPerPage from localStorage if not in URL
  let defaultRowsPerPage = initialRowsPerPage;
  try {
    const settings = JSON.parse(localStorage.getItem("settings") || "{}");
    defaultRowsPerPage = settings?.tableDefaultRowsPerPage || initialRowsPerPage;
  } catch {
    // Invalid JSON in localStorage, use initialRowsPerPage
    defaultRowsPerPage = initialRowsPerPage;
  }

  // Convert from 1-indexed URL page to 0-indexed table page
  // If no page in URL, use initialPage (0-indexed)
  const urlPage = search.page;
  const page = urlPage !== undefined ? urlPage - 1 : initialPage;
  const rowsPerPage = search.rowsPerPage ?? defaultRowsPerPage;

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    // Convert from 0-indexed table page to 1-indexed URL page
    const urlPage = newPage + 1;
    // TanStack Router requires route-specific types for search params.
    // Since this is a generic hook used across many routes, we use `any` here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (router.navigate as any)({
      search: (prev: Record<string, unknown>) => ({ ...prev, page: urlPage }),
    });
  }, []);

  const handleChangeRowsPerPage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);

    // Update localStorage only on user interaction
    try {
      const settings = JSON.parse(localStorage.getItem("settings") || "{}");
      settings.tableDefaultRowsPerPage = newRowsPerPage;
      localStorage.setItem("settings", JSON.stringify(settings));
    } catch {
      // If localStorage is corrupted, just set the new value
      localStorage.setItem("settings", JSON.stringify({ tableDefaultRowsPerPage: newRowsPerPage }));
    }

    // Update URL - reset to page 1 (1-indexed)
    // TanStack Router requires route-specific types for search params.
    // Since this is a generic hook used across many routes, we use `any` here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (router.navigate as any)({
      search: (prev: Record<string, unknown>) => ({ ...prev, rowsPerPage: newRowsPerPage, page: 1 }),
    });
  }, []);

  return {
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
  };
}
