import { MatchFunctions, createSearchMatchFunction } from "@/core/providers/Filter";
import { ClusterInterceptor } from "@my-project/shared";
import { ClusterInterceptorListFilterValues } from "./types";

export const CLUSTER_INTERCEPTOR_LIST_FILTER_NAMES = { SEARCH: "search" } as const;

export const clusterInterceptorFilterDefaultValues: ClusterInterceptorListFilterValues = {
  [CLUSTER_INTERCEPTOR_LIST_FILTER_NAMES.SEARCH]: "",
};

export const matchFunctions: MatchFunctions<ClusterInterceptor, ClusterInterceptorListFilterValues> = {
  [CLUSTER_INTERCEPTOR_LIST_FILTER_NAMES.SEARCH]: createSearchMatchFunction<ClusterInterceptor>(),
};
