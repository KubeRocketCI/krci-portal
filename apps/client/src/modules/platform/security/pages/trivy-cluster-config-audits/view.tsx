import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { ShieldAlert } from "lucide-react";
import { ClusterConfigAuditList } from "./components/ClusterConfigAuditList";

export default function TrivyClusterConfigAuditsPageContent() {
  return (
    <PageWrapper
      breadcrumbs={[{ label: "Security" }, { label: "Cluster Security" }, { label: "Cluster Configuration Audits" }]}
    >
      <Section
        icon={ShieldAlert}
        title="Cluster Configuration Audit Reports"
        description="Cluster-wide configuration audit security assessments"
      >
        <ClusterConfigAuditList />
      </Section>
    </PageWrapper>
  );
}
