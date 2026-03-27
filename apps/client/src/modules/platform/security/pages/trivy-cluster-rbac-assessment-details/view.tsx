import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { ShieldAlert } from "lucide-react";
import { routeTrivyClusterRbacAssessmentDetails } from "./route";
import { PATH_TRIVY_CLUSTER_RBAC_ASSESSMENTS_FULL } from "../trivy-cluster-rbac-assessments/route";
import { ClusterRbacHeader } from "./components/ClusterRbacHeader";
import { ChecksList } from "../trivy-config-audit-details/components/ChecksList";
import { useClusterRbacAssessmentReportWatchItem } from "@/k8s/api/groups/Trivy/ClusterRbacAssessmentReport";
import { Badge } from "@/core/components/ui/badge";

export default function TrivyClusterRbacAssessmentDetailsPageContent() {
  const { name, clusterName } = routeTrivyClusterRbacAssessmentDetails.useParams();

  const {
    data: report,
    isLoading,
    query,
  } = useClusterRbacAssessmentReportWatchItem({
    name,
  });

  const displayTitle = report?.metadata?.name || name;
  const summary = report?.report.summary;
  const totalIssues = summary ? summary.criticalCount + summary.highCount + summary.mediumCount + summary.lowCount : -1;
  const actions = (
    <>
      <Badge variant="outline" className="text-xs">
        ClusterRole
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
            label: "Cluster RBAC Assessments",
            route: {
              to: PATH_TRIVY_CLUSTER_RBAC_ASSESSMENTS_FULL,
              params: { clusterName },
            },
          },
          { label: name },
        ]}
      >
        <PageContentWrapper icon={ShieldAlert} title={name} description="Cluster-level RBAC policy assessment results">
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
          label: "Cluster RBAC Assessments",
          route: {
            to: PATH_TRIVY_CLUSTER_RBAC_ASSESSMENTS_FULL,
            params: { clusterName },
          },
        },
        { label: "Assessment Details" },
      ]}
    >
      <PageContentWrapper
        icon={ShieldAlert}
        title={displayTitle}
        description="Cluster-level RBAC policy assessment results"
        actions={actions}
        subHeader={
          <div className="ml-12">
            <ClusterRbacHeader report={report} isLoading={isLoading} />
          </div>
        }
      >
        <ChecksList report={report} isLoading={isLoading} />
      </PageContentWrapper>
    </PageWrapper>
  );
}
