import { PageWrapper } from "@/core/components/PageWrapper";
import { routeTrivyRbacAssessmentDetails } from "./route";
import { PATH_TRIVY_RBAC_ASSESSMENTS_FULL } from "../trivy-rbac-assessments/route";
import { RbacHeader } from "./components/RbacHeader";
import { ChecksList } from "../trivy-config-audit-details/components/ChecksList";
import { useRbacAssessmentReportWatchItem } from "@/k8s/api/groups/Trivy/RbacAssessmentReport";

export default function TrivyRbacAssessmentDetailsPageContent() {
  const { namespace, name, clusterName } = routeTrivyRbacAssessmentDetails.useParams();

  const {
    data: report,
    isLoading,
    query,
  } = useRbacAssessmentReportWatchItem({
    namespace,
    name,
  });

  if (query.error) {
    return (
      <PageWrapper
        breadcrumbs={[
          { label: "Security" },
          { label: "Namespace Security" },
          {
            label: "RBAC Assessments",
            route: {
              to: PATH_TRIVY_RBAC_ASSESSMENTS_FULL,
              params: { clusterName },
            },
          },
          { label: name },
        ]}
      >
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600">Error Loading Report</h2>
            <p className="text-muted-foreground mt-2">{query.error.message}</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Security" },
        { label: "Namespace Security" },
        {
          label: "RBAC Assessments",
          route: {
            to: PATH_TRIVY_RBAC_ASSESSMENTS_FULL,
            params: { clusterName },
          },
        },
        { label: "Assessment Details" },
      ]}
    >
      <div className="space-y-4">
        <RbacHeader report={report} isLoading={isLoading} />
        <ChecksList report={report} isLoading={isLoading} />
      </div>
    </PageWrapper>
  );
}
