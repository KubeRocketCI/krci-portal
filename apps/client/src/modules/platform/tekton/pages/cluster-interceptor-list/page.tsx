import { FilterProvider } from "@/core/providers/Filter";
import { ClusterInterceptor } from "@my-project/shared";
import { ClusterInterceptorListFilterValues } from "./components/ClusterInterceptorFilter/types";
import { clusterInterceptorFilterDefaultValues, matchFunctions } from "./components/ClusterInterceptorFilter/constants";
import PageView from "./view";

export default function ClusterInterceptorListPage() {
  return (
    <FilterProvider<ClusterInterceptor, ClusterInterceptorListFilterValues>
      defaultValues={clusterInterceptorFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <PageView />
    </FilterProvider>
  );
}
