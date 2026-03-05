import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { ShieldAlert } from "lucide-react";
import { ClusterRbacAssessmentList } from "./components/ClusterRbacAssessmentList";

export default function TrivyClusterRbacAssessmentsPageContent() {
  return (
    <PageWrapper
      breadcrumbs={[{ label: "Security" }, { label: "Cluster Security" }, { label: "Cluster RBAC Assessments" }]}
    >
      <PageContentWrapper
        icon={ShieldAlert}
        title="Cluster RBAC Assessment Reports"
        description="Cluster-wide RBAC policy security assessments for ClusterRoles"
      >
        <ClusterRbacAssessmentList />
      </PageContentWrapper>
    </PageWrapper>
  );
}
