import type { FormAsyncValidateOrFn, FormValidateOrFn, ReactFormExtendedApi } from "@tanstack/react-form";
import { ReactNode } from "react";

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

// Type for the form instance returned by useForm (includes Field component and all methods)
// All validator generics can be undefined since we don't use validation in filters
export type FilterFormApi<Values> = ReactFormExtendedApi<
  Values,
  FormValidateOrFn<Values> | undefined,
  FormValidateOrFn<Values> | undefined,
  FormAsyncValidateOrFn<Values> | undefined,
  FormValidateOrFn<Values> | undefined,
  FormAsyncValidateOrFn<Values> | undefined,
  FormValidateOrFn<Values> | undefined,
  FormAsyncValidateOrFn<Values> | undefined,
  FormValidateOrFn<Values> | undefined,
  FormAsyncValidateOrFn<Values> | undefined,
  FormAsyncValidateOrFn<Values> | undefined,
  never
>;

export interface FilterContextValue<Item, Values extends FilterValueMap> {
  form: FilterFormApi<Values>;
  filterFunction: (item: Item) => boolean;
  reset: () => void;
}
