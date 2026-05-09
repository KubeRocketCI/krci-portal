import { FilterProvider } from "@/core/providers/Filter";
import { Interceptor } from "@my-project/shared";
import { InterceptorListFilterValues } from "./components/InterceptorFilter/types";
import { interceptorFilterDefaultValues, matchFunctions } from "./components/InterceptorFilter/constants";
import PageView from "./view";

export default function InterceptorListPage() {
  return (
    <FilterProvider<Interceptor, InterceptorListFilterValues>
      defaultValues={interceptorFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <PageView />
    </FilterProvider>
  );
}
