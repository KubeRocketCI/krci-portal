import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { FileWarning } from "lucide-react";
import { routeTrivyConfigAuditDetails } from "./route";
import { PATH_TRIVY_CONFIG_AUDITS_FULL } from "../trivy-config-audits/route";
import { AuditHeader } from "./components/AuditHeader";
import { ChecksList } from "./components/ChecksList";
import { useConfigAuditReportWatchItem } from "@/k8s/api/groups/Trivy/ConfigAuditReport";
import { configAuditReportLabels } from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";

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

  const resourceName =
    report?.metadata?.labels?.[configAuditReportLabels.resourceName] || report?.metadata?.name || name;
  const resourceKind = report?.metadata?.labels?.[configAuditReportLabels.resourceKind] || "";
  const displayTitle = report ? resourceName : name;
  const summary = report?.report.summary;
  const totalIssues = summary ? summary.criticalCount + summary.highCount + summary.mediumCount + summary.lowCount : -1;
  const actions = (
    <>
      {resourceKind && (
        <Badge variant="outline" className="text-xs">
          {resourceKind}
        </Badge>
      )}
      {totalIssues === 0 && <Badge variant="success">No Issues</Badge>}
    </>
  );

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
        <PageContentWrapper
          icon={FileWarning}
          title={name}
          description="Configuration audit check results for this resource"
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
      <PageContentWrapper
        icon={FileWarning}
        title={displayTitle}
        description="Configuration audit check results for this resource"
        actions={actions}
        subHeader={
          <div className="ml-12">
            <AuditHeader report={report} isLoading={isLoading} />
          </div>
        }
      >
        <ChecksList report={report} isLoading={isLoading} />
      </PageContentWrapper>
    </PageWrapper>
  );
}
