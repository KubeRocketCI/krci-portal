import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { ShieldAlert } from "lucide-react";
import { ClusterConfigAuditList } from "./components/ClusterConfigAuditList";

export default function TrivyClusterConfigAuditsPageContent() {
  return (
    <PageWrapper
      breadcrumbs={[{ label: "Security" }, { label: "Cluster Security" }, { label: "Cluster Configuration Audits" }]}
    >
      <PageContentWrapper
        icon={ShieldAlert}
        title="Cluster Configuration Audit Reports"
        description="Cluster-wide configuration audit security assessments"
      >
        <ClusterConfigAuditList />
      </PageContentWrapper>
    </PageWrapper>
  );
}
