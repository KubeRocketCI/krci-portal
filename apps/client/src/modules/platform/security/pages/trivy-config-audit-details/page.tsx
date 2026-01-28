import { FilterProvider } from "@/core/providers/Filter";
import { checksListFilterDefaultValues, matchFunctions } from "./components/ChecksListFilter/constants";
import { ChecksListFilterValues } from "./components/ChecksListFilter/types";
import { AuditCheckWithId } from "./types";
import TrivyConfigAuditDetailsPageContent from "./view";

export default function TrivyConfigAuditDetailsPage() {
  return (
    <FilterProvider<AuditCheckWithId, ChecksListFilterValues>
      defaultValues={checksListFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <TrivyConfigAuditDetailsPageContent />
    </FilterProvider>
  );
}
