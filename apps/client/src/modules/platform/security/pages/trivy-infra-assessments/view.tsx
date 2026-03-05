import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { Server } from "lucide-react";
import { useCallback } from "react";
import { InfraAssessmentList } from "./components/InfraAssessmentList";
import { NamespaceSelector, getValidNamespace } from "@/modules/platform/security/components/trivy";
import { useDiscoverTrivyNamespaces } from "../trivy-overview/hooks/useDiscoverTrivyNamespaces";
import { routeTrivyInfraAssessments, PATH_TRIVY_INFRA_ASSESSMENTS_FULL } from "./route";
import { router } from "@/core/router";

export default function TrivyInfraAssessmentsPageContent() {
  const params = routeTrivyInfraAssessments.useParams();
  const search = routeTrivyInfraAssessments.useSearch();

  const {
    namespaces: discoveredNamespaces,
    isLoading: isDiscoveringNamespaces,
    defaultNamespace,
  } = useDiscoverTrivyNamespaces();

  const selectedNamespace = getValidNamespace(search.namespace, discoveredNamespaces, defaultNamespace);

  const handleNamespaceChange = useCallback(
    (namespace: string) => {
      router.navigate({
        to: PATH_TRIVY_INFRA_ASSESSMENTS_FULL,
        params,
        search: (prev) => ({ ...prev, namespace, page: 1 }),
      });
    },
    [params]
  );

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Security" }, { label: "Namespace Security" }, { label: "Infrastructure Assessments" }]}
    >
      <PageContentWrapper
        icon={Server}
        title="Infrastructure Assessment Reports"
        description={`Infrastructure security assessments in namespace: ${selectedNamespace}`}
        actions={
          <NamespaceSelector
            value={selectedNamespace}
            onChange={handleNamespaceChange}
            namespaces={discoveredNamespaces}
            isLoading={isDiscoveringNamespaces}
          />
        }
      >
        <InfraAssessmentList namespace={selectedNamespace} />
      </PageContentWrapper>
    </PageWrapper>
  );
}
