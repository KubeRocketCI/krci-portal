import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { Server } from "lucide-react";
import { routeTrivyClusterInfraAssessmentDetails } from "./route";
import { PATH_TRIVY_CLUSTER_INFRA_ASSESSMENTS_FULL } from "../trivy-cluster-infra-assessments/route";
import { ClusterInfraHeader } from "./components/ClusterInfraHeader";
import { ChecksList } from "../trivy-config-audit-details/components/ChecksList";
import { useClusterInfraAssessmentReportWatchItem } from "@/k8s/api/groups/Trivy/ClusterInfraAssessmentReport";
import { Badge } from "@/core/components/ui/badge";

export default function TrivyClusterInfraAssessmentDetailsPageContent() {
  const { name, clusterName } = routeTrivyClusterInfraAssessmentDetails.useParams();

  const {
    data: report,
    isLoading,
    query,
  } = useClusterInfraAssessmentReportWatchItem({
    name,
  });

  const displayTitle = report?.metadata?.name || name;
  const summary = report?.report.summary;
  const totalIssues = summary ? summary.criticalCount + summary.highCount + summary.mediumCount + summary.lowCount : -1;
  const actions = (
    <>
      <Badge variant="outline" className="text-xs">
        Cluster
      </Badge>
      {totalIssues === 0 && <Badge variant="success">No Issues</Badge>}
    </>
  );

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
        <PageContentWrapper
          icon={Server}
          title={name}
          description="Cluster-level infrastructure security assessment results"
        >
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-600">Error Loading Report</h2>
              <p className="text-muted-foreground mt-2">{query.error.message}</p>
            </div>
          </div>
        </PageContentWrapper>
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
      <PageContentWrapper
        icon={Server}
        title={displayTitle}
        description="Cluster-level infrastructure security assessment results"
        actions={actions}
        subHeader={
          <div className="ml-12">
            <ClusterInfraHeader report={report} isLoading={isLoading} />
          </div>
        }
      >
        <ChecksList report={report} isLoading={isLoading} />
      </PageContentWrapper>
    </PageWrapper>
  );
}
