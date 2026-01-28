import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { FileWarning } from "lucide-react";
import { useCallback } from "react";
import { ConfigAuditList } from "./components/ConfigAuditList";
import { NamespaceSelector, getValidNamespace } from "@/modules/platform/security/components/trivy";
import { useDiscoverTrivyNamespaces } from "../trivy-overview/hooks/useDiscoverTrivyNamespaces";
import { routeTrivyConfigAudits, PATH_TRIVY_CONFIG_AUDITS_FULL } from "./route";
import { router } from "@/core/router";

export default function TrivyConfigAuditsPageContent() {
  const params = routeTrivyConfigAudits.useParams();
  const search = routeTrivyConfigAudits.useSearch();

  // Discover namespaces: admins see all namespaces with Trivy data, limited users see their configured namespaces
  const {
    namespaces: discoveredNamespaces,
    isLoading: isDiscoveringNamespaces,
    defaultNamespace,
  } = useDiscoverTrivyNamespaces();

  // Use namespace from URL or fall back to default (validates against discovered/allowed namespaces)
  const selectedNamespace = getValidNamespace(search.namespace, discoveredNamespaces, defaultNamespace);

  const handleNamespaceChange = useCallback(
    (namespace: string) => {
      router.navigate({
        to: PATH_TRIVY_CONFIG_AUDITS_FULL,
        params,
        search: (prev) => ({ ...prev, namespace, page: 1 }),
      });
    },
    [params]
  );

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Security" }, { label: "Namespace Security" }, { label: "Configuration Audits" }]}
    >
      <Section
        icon={FileWarning}
        title="Configuration Audit Reports"
        description={`Kubernetes resource misconfigurations in namespace: ${selectedNamespace}`}
        actions={
          <NamespaceSelector
            value={selectedNamespace}
            onChange={handleNamespaceChange}
            namespaces={discoveredNamespaces}
            isLoading={isDiscoveringNamespaces}
          />
        }
      >
        <ConfigAuditList namespace={selectedNamespace} />
      </Section>
    </PageWrapper>
  );
}
