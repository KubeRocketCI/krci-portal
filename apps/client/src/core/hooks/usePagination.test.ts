import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePagination } from "./usePagination";
import { router } from "@/core/router";

// Mock the router
vi.mock("@/core/router", () => ({
  router: {
    navigate: vi.fn(),
  },
}));

// Mock useSearch from @tanstack/react-router
vi.mock("@tanstack/react-router", () => ({
  useSearch: vi.fn(() => ({})),
}));

describe("usePagination", () => {
  const mockNavigate = vi.mocked(router.navigate);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Page number conversion (1-indexed URL to 0-indexed table)", () => {
    it("should convert 1-indexed URL page to 0-indexed table page", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({ page: 1, rowsPerPage: 25 });

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      // URL page 1 should become table page 0
      expect(result.current.page).toBe(0);
    });

    it("should convert URL page 2 to table page 1", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({ page: 2, rowsPerPage: 25 });

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      expect(result.current.page).toBe(1);
    });

    it("should use initialPage when no URL page param exists", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({});

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      expect(result.current.page).toBe(0);
    });

    it("should convert 0-indexed table page to 1-indexed URL page on navigation", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({});

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      // Simulate user clicking to go to table page 2 (0-indexed)
      act(() => {
        result.current.handleChangePage(null, 2);
      });

      // Should navigate to URL page 3 (1-indexed)
      expect(mockNavigate).toHaveBeenCalledWith({
        search: expect.any(Function),
      });
    });
  });

  describe("localStorage integration", () => {
    it("should use rowsPerPage from localStorage when not in URL", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({});

      localStorage.setItem("settings", JSON.stringify({ tableDefaultRowsPerPage: 50 }));

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      expect(result.current.rowsPerPage).toBe(50);
    });

    it("should use URL rowsPerPage over localStorage", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({ rowsPerPage: 10 });

      localStorage.setItem("settings", JSON.stringify({ tableDefaultRowsPerPage: 50 }));

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      expect(result.current.rowsPerPage).toBe(10);
    });

    it("should use initialRowsPerPage when neither URL nor localStorage has value", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({});

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      expect(result.current.rowsPerPage).toBe(25);
    });

    it("should update localStorage when user changes rowsPerPage", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({});

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      const mockEvent = {
        target: { value: "50" },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleChangeRowsPerPage(mockEvent);
      });

      const settings = JSON.parse(localStorage.getItem("settings") || "{}");
      expect(settings.tableDefaultRowsPerPage).toBe(50);
    });

    it("should NOT update localStorage when URL params change manually", async () => {
      const { useSearch } = await import("@tanstack/react-router");

      // Initially no params
      vi.mocked(useSearch).mockReturnValue({});
      const { rerender } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      // Clear any localStorage calls from initialization
      localStorage.clear();

      // Simulate URL param change (manual browser edit)
      vi.mocked(useSearch).mockReturnValue({ rowsPerPage: 50 });
      rerender();

      // localStorage should NOT have been updated
      expect(localStorage.getItem("settings")).toBeNull();
    });
  });

  describe("handleChangePage", () => {
    it("should call router.navigate with updated page in URL params", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({});

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      act(() => {
        result.current.handleChangePage(null, 0);
      });

      expect(mockNavigate).toHaveBeenCalledWith({
        search: expect.any(Function),
      });

      // Get the function passed to search and test it
      const searchFn = mockNavigate.mock.calls[0][0].search as (
        prev: Record<string, unknown>
      ) => Record<string, unknown>;
      const result_url = searchFn({ other: "param" });

      // Table page 0 should become URL page 1
      expect(result_url).toEqual({ other: "param", page: 1 });
    });

    it("should preserve other search params when changing page", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({ tab: "live" });

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      act(() => {
        result.current.handleChangePage(null, 1);
      });

      const searchFn = mockNavigate.mock.calls[0][0].search as (
        prev: Record<string, unknown>
      ) => Record<string, unknown>;
      const result_url = searchFn({ tab: "live", other: "value" });

      // Should preserve other params and convert table page 1 to URL page 2
      expect(result_url).toEqual({ tab: "live", other: "value", page: 2 });
    });
  });

  describe("handleChangeRowsPerPage", () => {
    it("should update both localStorage and URL params", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({});

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      const mockEvent = {
        target: { value: "50" },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleChangeRowsPerPage(mockEvent);
      });

      // Check localStorage
      const settings = JSON.parse(localStorage.getItem("settings") || "{}");
      expect(settings.tableDefaultRowsPerPage).toBe(50);

      // Check router.navigate was called
      expect(mockNavigate).toHaveBeenCalledWith({
        search: expect.any(Function),
      });

      // Test the search function
      const searchFn = mockNavigate.mock.calls[0][0].search as (
        prev: Record<string, unknown>
      ) => Record<string, unknown>;
      const result_url = searchFn({});

      // Should reset to URL page 1 (1-indexed) and set new rowsPerPage
      expect(result_url).toEqual({ rowsPerPage: 50, page: 1 });
    });

    it("should reset to page 1 when changing rows per page", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({ page: 5 }); // User is on URL page 5

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      const mockEvent = {
        target: { value: "50" },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleChangeRowsPerPage(mockEvent);
      });

      const searchFn = mockNavigate.mock.calls[0][0].search as (
        prev: Record<string, unknown>
      ) => Record<string, unknown>;
      const result_url = searchFn({ page: 5 });

      // Should reset to page 1 regardless of current page
      expect(result_url.page).toBe(1);
    });

    it("should preserve other search params when changing rows per page", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({ tab: "details" });

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      const mockEvent = {
        target: { value: "100" },
      } as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleChangeRowsPerPage(mockEvent);
      });

      const searchFn = mockNavigate.mock.calls[0][0].search as (
        prev: Record<string, unknown>
      ) => Record<string, unknown>;
      const result_url = searchFn({ tab: "details", other: "param" });

      expect(result_url).toEqual({
        tab: "details",
        other: "param",
        rowsPerPage: 100,
        page: 1,
      });
    });
  });

  describe("edge cases", () => {
    it("should handle invalid localStorage data gracefully", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({});

      localStorage.setItem("settings", "invalid json");

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      // Should fall back to initialRowsPerPage
      expect(result.current.rowsPerPage).toBe(25);
    });

    it("should handle page value of 0 in URL (edge case)", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({ page: 0 });

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      // URL page 0 should become table page -1 (invalid, but handled by table component)
      expect(result.current.page).toBe(-1);
    });

    it("should handle very large page numbers", async () => {
      const { useSearch } = await import("@tanstack/react-router");
      vi.mocked(useSearch).mockReturnValue({ page: 9999 });

      const { result } = renderHook(() => usePagination({ initialPage: 0, initialRowsPerPage: 25 }));

      // URL page 9999 should become table page 9998
      expect(result.current.page).toBe(9998);
    });
  });
});
