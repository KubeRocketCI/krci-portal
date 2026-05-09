import { useFilterContext } from "@/core/providers/Filter";
import { ClusterInterceptor } from "@my-project/shared";
import { ClusterInterceptorListFilterValues } from "../types";

export function useClusterInterceptorFilter() {
  return useFilterContext<ClusterInterceptor, ClusterInterceptorListFilterValues>();
}
