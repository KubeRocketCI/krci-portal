import type { FilterValueMap } from "@/core/providers/Filter";

export interface CRListFilterValues extends FilterValueMap {
  search: string;
}

/**
 * Filter key for an auto-discovered printer column. Mirrors the original inline
 * convention from the CR list view (`pc:<name>`) so existing bookmarked URLs
 * continue to resolve after the refactor.
 */
export const printerColumnFilterKey = (name: string) => `pc:${name}` as const;
