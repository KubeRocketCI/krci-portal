import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { Shield } from "lucide-react";
import { ComplianceReportList } from "./components/ComplianceReportList";

export default function TrivyCompliancePageContent() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Security" }, { label: "Cluster Security" }, { label: "Compliance" }]}>
      <Section
        icon={Shield}
        title="Cluster Compliance Reports"
        description="Kubernetes security compliance benchmarks (CIS, NSA, PSS)"
      >
        <ComplianceReportList />
      </Section>
    </PageWrapper>
  );
}
