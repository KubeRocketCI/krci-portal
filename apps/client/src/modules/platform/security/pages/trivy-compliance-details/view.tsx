import { PageWrapper } from "@/core/components/PageWrapper";
import { routeTrivyComplianceDetails } from "./route";
import { PATH_TRIVY_COMPLIANCE_FULL } from "../trivy-compliance/route";
import { useClusterComplianceReportWatchItem } from "@/k8s/api/groups/Trivy/ClusterComplianceReport";
import { ComplianceHeader } from "./components/ComplianceHeader";
import { SeverityBreakdown } from "./components/SeverityBreakdown";
import { ControlsTable } from "./components/ControlsTable";
import { Skeleton } from "@/core/components/ui/skeleton";

export default function TrivyComplianceDetailsPageContent() {
  const { reportName, clusterName } = routeTrivyComplianceDetails.useParams();

  const {
    data: report,
    isLoading,
    query,
  } = useClusterComplianceReportWatchItem({
    name: reportName,
  });

  const reportTitle = report?.spec.compliance.title ?? reportName;
  const controls = report?.status?.summaryReport?.controlCheck ?? [];

  if (query.error) {
    return (
      <PageWrapper
        breadcrumbs={[
          { label: "Security" },
          { label: "Cluster Security" },
          {
            label: "Compliance",
            route: {
              to: PATH_TRIVY_COMPLIANCE_FULL,
              params: { clusterName },
            },
          },
          { label: reportName },
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
          label: "Compliance",
          route: {
            to: PATH_TRIVY_COMPLIANCE_FULL,
            params: { clusterName },
          },
        },
        { label: reportTitle },
      ]}
    >
      <div className="space-y-6">
        <ComplianceHeader report={report} isLoading={isLoading} />

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <SeverityBreakdown controls={controls} />
        )}

        <ControlsTable controls={controls} isLoading={isLoading} />
      </div>
    </PageWrapper>
  );
}
