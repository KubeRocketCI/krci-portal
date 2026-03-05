import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { Shield } from "lucide-react";
import { ClusterVulnerabilityReportList } from "./components/ClusterVulnerabilityReportList";

export default function TrivyClusterVulnerabilitiesPageContent() {
  return (
    <PageWrapper
      breadcrumbs={[{ label: "Security" }, { label: "Cluster Security" }, { label: "Cluster Vulnerability Reports" }]}
    >
      <PageContentWrapper
        icon={Shield}
        title="Cluster Vulnerability Reports"
        description="Cluster-wide container image vulnerability reports"
      >
        <ClusterVulnerabilityReportList />
      </PageContentWrapper>
    </PageWrapper>
  );
}
