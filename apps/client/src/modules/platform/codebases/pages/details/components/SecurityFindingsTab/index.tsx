import { useCodebaseSecuritySummary } from "@/modules/platform/security/components/defectdojo/hooks/useCodebaseSecuritySummary";
import { routeProjectDetails } from "../../route";
import { SecurityFindingsTabContent } from "./SecurityFindingsTabContent";

/** DefectDojo findings of the codebase. The tab exists only while DefectDojo is configured. */
export function SecurityFindingsTab({ codebaseName }: { codebaseName: string }) {
  const { clusterName, namespace } = routeProjectDetails.useParams();
  const summaryQuery = useCodebaseSecuritySummary(codebaseName);

  return (
    <SecurityFindingsTabContent
      clusterName={clusterName}
      namespace={namespace}
      summary={summaryQuery.data}
      isLoading={summaryQuery.isLoading}
      error={summaryQuery.error}
    />
  );
}
