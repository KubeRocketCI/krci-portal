import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { ShieldAlert } from "lucide-react";
import { useCallback } from "react";
import { RbacAssessmentList } from "./components/RbacAssessmentList";
import { NamespaceSelector, getValidNamespace } from "@/modules/platform/security/components/trivy";
import { useDiscoverTrivyNamespaces } from "../trivy-overview/hooks/useDiscoverTrivyNamespaces";
import { routeTrivyRbacAssessments, PATH_TRIVY_RBAC_ASSESSMENTS_FULL } from "./route";
import { router } from "@/core/router";

export default function TrivyRbacAssessmentsPageContent() {
  const params = routeTrivyRbacAssessments.useParams();
  const search = routeTrivyRbacAssessments.useSearch();

  const {
    namespaces: discoveredNamespaces,
    isLoading: isDiscoveringNamespaces,
    defaultNamespace,
  } = useDiscoverTrivyNamespaces();

  const selectedNamespace = getValidNamespace(search.namespace, discoveredNamespaces, defaultNamespace);

  const handleNamespaceChange = useCallback(
    (namespace: string) => {
      router.navigate({
        to: PATH_TRIVY_RBAC_ASSESSMENTS_FULL,
        params,
        search: (prev) => ({ ...prev, namespace, page: 1 }),
      });
    },
    [params]
  );

  return (
    <PageWrapper breadcrumbs={[{ label: "Security" }, { label: "Namespace Security" }, { label: "RBAC Assessments" }]}>
      <PageContentWrapper
        icon={ShieldAlert}
        title="RBAC Assessment Reports"
        description={`RBAC policy security assessments in namespace: ${selectedNamespace}`}
        actions={
          <NamespaceSelector
            value={selectedNamespace}
            onChange={handleNamespaceChange}
            namespaces={discoveredNamespaces}
            isLoading={isDiscoveringNamespaces}
          />
        }
      >
        <RbacAssessmentList namespace={selectedNamespace} />
      </PageContentWrapper>
    </PageWrapper>
  );
}
