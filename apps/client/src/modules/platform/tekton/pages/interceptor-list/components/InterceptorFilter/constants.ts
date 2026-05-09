import { MatchFunctions, createSearchMatchFunction, createNamespaceMatchFunction } from "@/core/providers/Filter";
import { Interceptor } from "@my-project/shared";
import { InterceptorListFilterValues } from "./types";

export const INTERCEPTOR_LIST_FILTER_NAMES = {
  SEARCH: "search",
  NAMESPACES: "namespaces",
} as const;

export const interceptorFilterDefaultValues: InterceptorListFilterValues = {
  [INTERCEPTOR_LIST_FILTER_NAMES.SEARCH]: "",
  [INTERCEPTOR_LIST_FILTER_NAMES.NAMESPACES]: [],
};

export const matchFunctions: MatchFunctions<Interceptor, InterceptorListFilterValues> = {
  [INTERCEPTOR_LIST_FILTER_NAMES.SEARCH]: createSearchMatchFunction<Interceptor>(),
  [INTERCEPTOR_LIST_FILTER_NAMES.NAMESPACES]: createNamespaceMatchFunction<Interceptor>(),
};
