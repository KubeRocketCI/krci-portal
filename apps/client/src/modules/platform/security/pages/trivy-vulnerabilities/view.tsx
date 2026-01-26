import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { Shield } from "lucide-react";
import { useCallback } from "react";
import { VulnerabilityReportList } from "./components/VulnerabilityReportList";
import { NamespaceSelector, getValidNamespace } from "@/modules/platform/security/components/trivy";
import { useDiscoverTrivyNamespaces } from "../trivy-overview/hooks/useDiscoverTrivyNamespaces";
import { routeTrivyVulnerabilities, PATH_TRIVY_VULNERABILITIES_FULL } from "./route";
import { router } from "@/core/router";

export default function TrivyVulnerabilitiesPageContent() {
  const params = routeTrivyVulnerabilities.useParams();
  const search = routeTrivyVulnerabilities.useSearch();

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
        to: PATH_TRIVY_VULNERABILITIES_FULL,
        params,
        search: (prev) => ({ ...prev, namespace, page: 1 }),
      });
    },
    [params]
  );

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Security" }, { label: "Container Scanning" }, { label: "Vulnerability Reports" }]}
    >
      <Section
        icon={Shield}
        title="Container Vulnerability Reports"
        description={`Unique container images with vulnerabilities in namespace: ${selectedNamespace}`}
        actions={
          <NamespaceSelector
            value={selectedNamespace}
            onChange={handleNamespaceChange}
            namespaces={discoveredNamespaces}
            isLoading={isDiscoveringNamespaces}
          />
        }
      >
        <VulnerabilityReportList namespace={selectedNamespace} />
      </Section>
    </PageWrapper>
  );
}
