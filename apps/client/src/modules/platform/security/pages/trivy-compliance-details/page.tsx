import { FilterProvider } from "@/core/providers/Filter";
import { controlsTableFilterDefaultValues, matchFunctions } from "./components/ControlsTableFilter/constants";
import { ControlsTableFilterValues } from "./components/ControlsTableFilter/types";
import { ControlTableRow } from "./types";
import TrivyComplianceDetailsPageContent from "./view";

export default function TrivyComplianceDetailsPage() {
  return (
    <FilterProvider<ControlTableRow, ControlsTableFilterValues>
      defaultValues={controlsTableFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <TrivyComplianceDetailsPageContent />
    </FilterProvider>
  );
}
