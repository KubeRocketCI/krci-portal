import { ShieldAlert } from "lucide-react";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { router } from "@/core/router";
import { useClusterStore } from "@/k8s/store";
import { Vulnerabilities } from "./components/Vulnerabilities";
import { PATH_VULNERABILITIES_FULL, routeVulnerabilities, type Search } from "./route";

export default function VulnerabilitiesPageContent() {
  const params = routeVulnerabilities.useParams();
  const search = routeVulnerabilities.useSearch();
  const namespace = useClusterStore((state) => state.defaultNamespace);

  const handleSearchChange = (next: Search) =>
    void router.navigate({ to: PATH_VULNERABILITIES_FULL, params, search: next });

  return (
    <PageWrapper breadcrumbs={[{ label: "Security" }, { label: "Findings" }, { label: "Vulnerabilities" }]}>
      <PageContentWrapper
        icon={ShieldAlert}
        title="Vulnerabilities"
        description="Vulnerability findings of the platform in DefectDojo, most severe first"
      >
        <Vulnerabilities
          search={search}
          onSearchChange={handleSearchChange}
          namespace={namespace}
          clusterName={params.clusterName}
        />
      </PageContentWrapper>
    </PageWrapper>
  );
}
