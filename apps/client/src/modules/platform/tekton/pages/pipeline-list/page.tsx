import { FilterProvider } from "@/core/providers/Filter";
import { Pipeline } from "@my-project/shared";
import { PipelineListFilterValues } from "./components/PipelineFilter/types";
import { pipelineFilterDefaultValues, matchFunctions } from "./components/PipelineFilter/constants";
import PageView from "./view";

export default function PipelineListPage() {
  return (
    <FilterProvider<Pipeline, PipelineListFilterValues>
      defaultValues={pipelineFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <PageView />
    </FilterProvider>
  );
}
