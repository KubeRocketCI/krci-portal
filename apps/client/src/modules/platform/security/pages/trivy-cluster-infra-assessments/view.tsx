import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { Server } from "lucide-react";
import { ClusterInfraAssessmentList } from "./components/ClusterInfraAssessmentList";

export default function TrivyClusterInfraAssessmentsPageContent() {
  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Security" },
        { label: "Cluster Security" },
        { label: "Cluster Infrastructure Assessments" },
      ]}
    >
      <PageContentWrapper
        icon={Server}
        title="Cluster Infrastructure Assessment Reports"
        description="Cluster-wide infrastructure security assessments for cluster resources"
      >
        <ClusterInfraAssessmentList />
      </PageContentWrapper>
    </PageWrapper>
  );
}
