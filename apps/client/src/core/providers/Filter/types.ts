import { ReactNode } from "react";
import { useAppForm } from "@/core/components/form";

export type FilterValueMap = Record<string, unknown>;

export type MatchFunction<Item, Value> = (item: Item, value: Value) => boolean;

export type MatchFunctions<Item, Values extends FilterValueMap> = {
  [K in keyof Values]?: MatchFunction<Item, Values[K]>;
};

export interface FilterProviderProps<Item, Values extends FilterValueMap> {
  children: ReactNode;
  defaultValues: Values;
  matchFunctions: MatchFunctions<Item, Values>;
  syncWithUrl?: boolean;
  /**
   * Applied to values read from the URL (when `syncWithUrl`) and to values passed to
   * `applyValues`, before they reach the form. Use it to translate a legacy URL
   * vocabulary onto current filter values.
   */
  normalizeUrlValues?: (values: Partial<Values>) => Partial<Values>;
}

// Internal helper to capture the form type
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useFilterFormInternal<Values extends FilterValueMap>(defaultValues: Values) {
  const form = useAppForm({
    defaultValues,
  });
  return form;
}

// Type for the form instance returned by useAppForm
export type FilterFormApi<Values extends FilterValueMap> = ReturnType<typeof useFilterFormInternal<Values>>;

/** Used only when the provider has `syncWithUrl`; otherwise no navigation happens. */
export interface ApplyFilterValuesOptions {
  /** Non-filter search params written in the same navigation, e.g. `{ view: id }`. `undefined` removes a param. */
  search?: Record<string, unknown>;
  /** Defaults to true. Pass false to add a browser history entry. */
  replace?: boolean;
}

export interface FilterContextValue<Item, Values extends FilterValueMap> {
  form: FilterFormApi<Values>;
  filterFunction: (item: Item) => boolean;
  reset: () => void;
  /**
   * Replaces every filter value: keys missing from `values` return to their defaults.
   * `normalizeUrlValues` runs on the result. With `syncWithUrl`, the URL is written in one navigation;
   * without it, `options` is ignored.
   */
  applyValues: (values: Partial<Values>, options?: ApplyFilterValuesOptions) => void;
  isDefaultValue: boolean;
}
