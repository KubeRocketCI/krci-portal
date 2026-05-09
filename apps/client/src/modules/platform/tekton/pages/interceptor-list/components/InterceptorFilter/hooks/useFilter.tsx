import { useFilterContext } from "@/core/providers/Filter";
import { Interceptor } from "@my-project/shared";
import { InterceptorListFilterValues } from "../types";

export function useInterceptorFilter() {
  return useFilterContext<Interceptor, InterceptorListFilterValues>();
}
