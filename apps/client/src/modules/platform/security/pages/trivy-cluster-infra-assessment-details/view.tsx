import { PageWrapper } from "@/core/components/PageWrapper";
import { routeTrivyClusterInfraAssessmentDetails } from "./route";
import { PATH_TRIVY_CLUSTER_INFRA_ASSESSMENTS_FULL } from "../trivy-cluster-infra-assessments/route";
import { ClusterInfraHeader } from "./components/ClusterInfraHeader";
import { ChecksList } from "../trivy-config-audit-details/components/ChecksList";
import { useClusterInfraAssessmentReportWatchItem } from "@/k8s/api/groups/Trivy/ClusterInfraAssessmentReport";

export default function TrivyClusterInfraAssessmentDetailsPageContent() {
  const { name, clusterName } = routeTrivyClusterInfraAssessmentDetails.useParams();

  const {
    data: report,
    isLoading,
    query,
  } = useClusterInfraAssessmentReportWatchItem({
    name,
  });

  if (query.error) {
    return (
      <PageWrapper
        breadcrumbs={[
          { label: "Security" },
          { label: "Cluster Security" },
          {
            label: "Cluster Infrastructure Assessments",
            route: {
              to: PATH_TRIVY_CLUSTER_INFRA_ASSESSMENTS_FULL,
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
          label: "Cluster Infrastructure Assessments",
          route: {
            to: PATH_TRIVY_CLUSTER_INFRA_ASSESSMENTS_FULL,
            params: { clusterName },
          },
        },
        { label: "Assessment Details" },
      ]}
    >
      <div className="space-y-4">
        <ClusterInfraHeader report={report} isLoading={isLoading} />
        <ChecksList report={report} isLoading={isLoading} />
      </div>
    </PageWrapper>
  );
}
