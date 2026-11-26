import { Shield } from "lucide-react";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { router } from "@/core/router";
import { useClusterStore } from "@/k8s/store";
import { SecurityOverview } from "./components/SecurityOverview";
import { PATH_SECURITY_OVERVIEW_FULL, routeSecurityOverview, type Search } from "./route";

export default function SecurityOverviewPageContent() {
  const params = routeSecurityOverview.useParams();
  const search = routeSecurityOverview.useSearch();
  const namespace = useClusterStore((state) => state.defaultNamespace);

  const handleSearchChange = (next: Search) =>
    void router.navigate({ to: PATH_SECURITY_OVERVIEW_FULL, params, search: next });

  return (
    <PageWrapper breadcrumbs={[{ label: "Security" }, { label: "Findings" }, { label: "Overview" }]}>
      <PageContentWrapper
        icon={Shield}
        title="Security Overview"
        description="Findings of the platform in DefectDojo by level, namespace and codebase"
      >
        <SecurityOverview
          search={search}
          onSearchChange={handleSearchChange}
          namespace={namespace}
          clusterName={params.clusterName}
        />
      </PageContentWrapper>
    </PageWrapper>
  );
}
