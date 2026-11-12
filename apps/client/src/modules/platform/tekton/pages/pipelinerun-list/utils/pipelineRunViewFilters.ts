import { getNonDefaultFilterValues } from "@/core/providers/Filter";
import { sortByName } from "@/core/utils/sortByName";
import {
  CODEBASE_DIVIDER_VALUE,
  defaultPipelineRunFilterValues,
  normalizePipelineRunFilterUrlValues,
  pipelineRunFilterControlNames,
} from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";
import type { PipelineRunListFilterValues } from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/types";
import { PIPELINERUN_LIST_FILTER_CONTROLS } from "../constants";
import type { PipelineRunViewFilters } from "../types";

const VIEW_FILTER_KEYS: readonly string[] = PIPELINERUN_LIST_FILTER_CONTROLS;
const VIEW_FILTER_KEYS_WITHOUT_NAMESPACES = VIEW_FILTER_KEYS.filter(
  (key) => key !== pipelineRunFilterControlNames.NAMESPACES
);

export interface PipelineRunViewFiltersOptions {
  /** False when the page hides the Namespaces control (one allowed namespace). Defaults to true. */
  includeNamespaces?: boolean;
}

/**
 * Stored or current values reduced to what a view holds: page filter keys only, type-checked
 * against the defaults, legacy values normalized, defaults dropped. Never throws.
 */
export const toPipelineRunViewFilters = (
  values: Record<string, unknown> | undefined,
  { includeNamespaces = true }: PipelineRunViewFiltersOptions = {}
): PipelineRunViewFilters => {
  const keys = includeNamespaces ? VIEW_FILTER_KEYS : VIEW_FILTER_KEYS_WITHOUT_NAMESPACES;
  const typed: Record<string, unknown> = {};

  for (const key of keys) {
    const value = values?.[key];
    const defaultValue = defaultPipelineRunFilterValues[key as keyof PipelineRunListFilterValues];

    if (Array.isArray(defaultValue)) {
      const items = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
      typed[key] = [
        ...new Set(items.filter((item): item is string => typeof item === "string" && item !== CODEBASE_DIVIDER_VALUE)),
      ];
    } else if (typeof value === "string") {
      typed[key] = value;
    }
  }

  const normalized = { ...typed, ...normalizePipelineRunFilterUrlValues(typed as PipelineRunViewFilters) };

  return getNonDefaultFilterValues(normalized, defaultPipelineRunFilterValues, keys);
};

const sortedEntries = (filters: PipelineRunViewFilters) =>
  Object.entries(filters)
    .map(([key, value]) => [key, Array.isArray(value) ? [...value].sort(sortByName) : value] as const)
    .sort(([a], [b]) => sortByName(a, b));

/** Order-insensitive for keys and array items. Pass values produced by `toPipelineRunViewFilters`. */
export const arePipelineRunViewFiltersEqual = (a: PipelineRunViewFilters, b: PipelineRunViewFilters): boolean =>
  JSON.stringify(sortedEntries(a)) === JSON.stringify(sortedEntries(b));
