import { FilterProvider } from "@/core/providers/Filter";
import CDPipelineListPageContent from "./view";
import { CDPipeline } from "@my-project/shared";
import { CDPipelineFilterValues } from "./components/CDPipelineFilter/types";
import { cdPipelineFilterDefaultValues, matchFunctions } from "./components/CDPipelineFilter/constants";

export default function CDPipelineListPage() {
  return (
    <FilterProvider<CDPipeline, CDPipelineFilterValues>
      defaultValues={cdPipelineFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <CDPipelineListPageContent />
    </FilterProvider>
  );
}
