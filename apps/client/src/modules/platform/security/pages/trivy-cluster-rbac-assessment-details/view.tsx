import { PageWrapper } from "@/core/components/PageWrapper";
import { routeTrivyClusterRbacAssessmentDetails } from "./route";
import { PATH_TRIVY_CLUSTER_RBAC_ASSESSMENTS_FULL } from "../trivy-cluster-rbac-assessments/route";
import { ClusterRbacHeader } from "./components/ClusterRbacHeader";
import { ChecksList } from "../trivy-config-audit-details/components/ChecksList";
import { useClusterRbacAssessmentReportWatchItem } from "@/k8s/api/groups/Trivy/ClusterRbacAssessmentReport";

export default function TrivyClusterRbacAssessmentDetailsPageContent() {
  const { name, clusterName } = routeTrivyClusterRbacAssessmentDetails.useParams();

  const {
    data: report,
    isLoading,
    query,
  } = useClusterRbacAssessmentReportWatchItem({
    name,
  });

  if (query.error) {
    return (
      <PageWrapper
        breadcrumbs={[
          { label: "Security" },
          { label: "Cluster Security" },
          {
            label: "Cluster RBAC Assessments",
            route: {
              to: PATH_TRIVY_CLUSTER_RBAC_ASSESSMENTS_FULL,
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
        { label: "Cluster Security" },
        {
          label: "Cluster RBAC Assessments",
          route: {
            to: PATH_TRIVY_CLUSTER_RBAC_ASSESSMENTS_FULL,
            params: { clusterName },
          },
        },
        { label: "Assessment Details" },
      ]}
    >
      <div className="space-y-4">
        <ClusterRbacHeader report={report} isLoading={isLoading} />
        <ChecksList report={report} isLoading={isLoading} />
      </div>
    </PageWrapper>
  );
}
