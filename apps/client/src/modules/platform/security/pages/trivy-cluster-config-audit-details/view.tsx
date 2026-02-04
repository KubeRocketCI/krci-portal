import { PageWrapper } from "@/core/components/PageWrapper";
import { routeTrivyClusterConfigAuditDetails } from "./route";
import { PATH_TRIVY_CLUSTER_CONFIG_AUDITS_FULL } from "../trivy-cluster-config-audits/route";
import { ClusterConfigAuditHeader } from "./components/ClusterConfigAuditHeader";
import { ChecksList } from "../trivy-config-audit-details/components/ChecksList";
import { useClusterConfigAuditReportWatchItem } from "@/k8s/api/groups/Trivy/ClusterConfigAuditReport";

export default function TrivyClusterConfigAuditDetailsPageContent() {
  const { name, clusterName } = routeTrivyClusterConfigAuditDetails.useParams();

  const {
    data: report,
    isLoading,
    query,
  } = useClusterConfigAuditReportWatchItem({
    name,
  });

  if (query.error) {
    return (
      <PageWrapper
        breadcrumbs={[
          { label: "Security" },
          { label: "Cluster Security" },
          {
            label: "Cluster Configuration Audits",
            route: {
              to: PATH_TRIVY_CLUSTER_CONFIG_AUDITS_FULL,
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
          label: "Cluster Configuration Audits",
          route: {
            to: PATH_TRIVY_CLUSTER_CONFIG_AUDITS_FULL,
            params: { clusterName },
          },
        },
        { label: "Audit Details" },
      ]}
    >
      <div className="space-y-4">
        <ClusterConfigAuditHeader report={report} isLoading={isLoading} />
        <ChecksList report={report} isLoading={isLoading} />
      </div>
    </PageWrapper>
  );
}
