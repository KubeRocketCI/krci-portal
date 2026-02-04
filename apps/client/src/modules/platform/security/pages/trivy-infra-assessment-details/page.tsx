import { FilterProvider } from "@/core/providers/Filter";
import {
  checksListFilterDefaultValues,
  matchFunctions,
} from "../trivy-config-audit-details/components/ChecksListFilter/constants";
import { ChecksListFilterValues } from "../trivy-config-audit-details/components/ChecksListFilter/types";
import { AuditCheckWithId } from "../trivy-config-audit-details/types";
import TrivyInfraAssessmentDetailsPageContent from "./view";

export default function TrivyInfraAssessmentDetailsPage() {
  return (
    <FilterProvider<AuditCheckWithId, ChecksListFilterValues>
      defaultValues={checksListFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <TrivyInfraAssessmentDetailsPageContent />
    </FilterProvider>
  );
}
