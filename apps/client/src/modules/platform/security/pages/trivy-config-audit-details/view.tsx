import { PageWrapper } from "@/core/components/PageWrapper";
import { routeTrivyConfigAuditDetails } from "./route";
import { PATH_TRIVY_CONFIG_AUDITS_FULL } from "../trivy-config-audits/route";
import { AuditHeader } from "./components/AuditHeader";
import { ChecksList } from "./components/ChecksList";
import { useConfigAuditReportWatchItem } from "@/k8s/api/groups/Trivy/ConfigAuditReport";

export default function TrivyConfigAuditDetailsPageContent() {
  const { namespace, name, clusterName } = routeTrivyConfigAuditDetails.useParams();

  const {
    data: report,
    isLoading,
    query,
  } = useConfigAuditReportWatchItem({
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
            label: "Configuration Audits",
            route: {
              to: PATH_TRIVY_CONFIG_AUDITS_FULL,
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
          label: "Configuration Audits",
          route: {
            to: PATH_TRIVY_CONFIG_AUDITS_FULL,
            params: { clusterName },
          },
        },
        { label: "Audit Details" },
      ]}
    >
      <div className="space-y-4">
        <AuditHeader report={report} isLoading={isLoading} />
        <ChecksList report={report} isLoading={isLoading} />
      </div>
    </PageWrapper>
  );
}
