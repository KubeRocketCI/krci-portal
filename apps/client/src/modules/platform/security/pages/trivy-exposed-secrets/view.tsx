import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { KeyRound } from "lucide-react";
import { useCallback } from "react";
import { ExposedSecretList } from "./components/ExposedSecretList";
import { NamespaceSelector, getValidNamespace } from "@/modules/platform/security/components/trivy";
import { useDiscoverTrivyNamespaces } from "../trivy-overview/hooks/useDiscoverTrivyNamespaces";
import { routeTrivyExposedSecrets, PATH_TRIVY_EXPOSED_SECRETS_FULL } from "./route";
import { router } from "@/core/router";

export default function TrivyExposedSecretsPageContent() {
  const params = routeTrivyExposedSecrets.useParams();
  const search = routeTrivyExposedSecrets.useSearch();

  const {
    namespaces: discoveredNamespaces,
    isLoading: isDiscoveringNamespaces,
    defaultNamespace,
  } = useDiscoverTrivyNamespaces();

  const selectedNamespace = getValidNamespace(search.namespace, discoveredNamespaces, defaultNamespace);

  const handleNamespaceChange = useCallback(
    (namespace: string) => {
      router.navigate({
        to: PATH_TRIVY_EXPOSED_SECRETS_FULL,
        params,
        search: (prev) => ({ ...prev, namespace, page: 1 }),
      });
    },
    [params]
  );

  return (
    <PageWrapper breadcrumbs={[{ label: "Security" }, { label: "Container Scanning" }, { label: "Exposed Secrets" }]}>
      <Section
        icon={KeyRound}
        title="Exposed Secret Reports"
        description={`Exposed secrets detected in container images in namespace: ${selectedNamespace}`}
        actions={
          <NamespaceSelector
            value={selectedNamespace}
            onChange={handleNamespaceChange}
            namespaces={discoveredNamespaces}
            isLoading={isDiscoveringNamespaces}
          />
        }
      >
        <ExposedSecretList namespace={selectedNamespace} />
      </Section>
    </PageWrapper>
  );
}
