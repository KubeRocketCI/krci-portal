import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { Shield } from "lucide-react";
import { ClusterVulnerabilityReportList } from "./components/ClusterVulnerabilityReportList";

export default function TrivyClusterVulnerabilitiesPageContent() {
  return (
    <PageWrapper
      breadcrumbs={[{ label: "Security" }, { label: "Cluster Security" }, { label: "Cluster Vulnerability Reports" }]}
    >
      <Section
        icon={Shield}
        title="Cluster Vulnerability Reports"
        description="Cluster-wide container image vulnerability reports"
      >
        <ClusterVulnerabilityReportList />
      </Section>
    </PageWrapper>
  );
}
