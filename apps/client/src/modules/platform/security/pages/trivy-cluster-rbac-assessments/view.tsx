import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { ShieldAlert } from "lucide-react";
import { ClusterRbacAssessmentList } from "./components/ClusterRbacAssessmentList";

export default function TrivyClusterRbacAssessmentsPageContent() {
  return (
    <PageWrapper
      breadcrumbs={[{ label: "Security" }, { label: "Cluster Security" }, { label: "Cluster RBAC Assessments" }]}
    >
      <Section
        icon={ShieldAlert}
        title="Cluster RBAC Assessment Reports"
        description="Cluster-wide RBAC policy security assessments for ClusterRoles"
      >
        <ClusterRbacAssessmentList />
      </Section>
    </PageWrapper>
  );
}
