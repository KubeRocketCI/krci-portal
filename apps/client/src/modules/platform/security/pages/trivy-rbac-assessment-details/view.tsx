import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { ShieldAlert } from "lucide-react";
import { routeTrivyRbacAssessmentDetails } from "./route";
import { PATH_TRIVY_RBAC_ASSESSMENTS_FULL } from "../trivy-rbac-assessments/route";
import { RbacHeader } from "./components/RbacHeader";
import { ChecksList } from "../trivy-config-audit-details/components/ChecksList";
import { useRbacAssessmentReportWatchItem } from "@/k8s/api/groups/Trivy/RbacAssessmentReport";
import { rbacAssessmentReportLabels } from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";

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

  const resourceName =
    report?.metadata?.labels?.[rbacAssessmentReportLabels.resourceName] || report?.metadata?.name || name;
  const resourceKind = report?.metadata?.labels?.[rbacAssessmentReportLabels.resourceKind] || "";
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
            label: "RBAC Assessments",
            route: {
              to: PATH_TRIVY_RBAC_ASSESSMENTS_FULL,
              params: { clusterName },
            },
          },
          { label: name },
        ]}
      >
        <PageContentWrapper
          icon={ShieldAlert}
          title={name}
          description="RBAC policy assessment results for this resource"
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
          label: "RBAC Assessments",
          route: {
            to: PATH_TRIVY_RBAC_ASSESSMENTS_FULL,
            params: { clusterName },
          },
        },
        { label: "Assessment Details" },
      ]}
    >
      <PageContentWrapper
        icon={ShieldAlert}
        title={displayTitle}
        description="RBAC policy assessment results for this resource"
        actions={actions}
        subHeader={
          <div className="ml-12">
            <RbacHeader report={report} isLoading={isLoading} />
          </div>
        }
      >
        <ChecksList report={report} isLoading={isLoading} />
      </PageContentWrapper>
    </PageWrapper>
  );
}
