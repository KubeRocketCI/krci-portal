import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { Shield } from "lucide-react";
import { ComplianceReportList } from "./components/ComplianceReportList";

export default function TrivyCompliancePageContent() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Security" }, { label: "Cluster Security" }, { label: "Compliance" }]}>
      <PageContentWrapper
        icon={Shield}
        title="Cluster Compliance Reports"
        description="Kubernetes security compliance benchmarks (CIS, NSA, PSS)"
      >
        <ComplianceReportList />
      </PageContentWrapper>
    </PageWrapper>
  );
}
