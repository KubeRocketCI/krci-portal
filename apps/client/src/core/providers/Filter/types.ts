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

export interface FilterContextValue<Item, Values extends FilterValueMap> {
  form: FilterFormApi<Values>;
  filterFunction: (item: Item) => boolean;
  reset: () => void;
}
