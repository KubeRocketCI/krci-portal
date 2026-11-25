import { KeyRound } from "lucide-react";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { router } from "@/core/router";
import { useClusterStore } from "@/k8s/store";
import { ExposedSecrets } from "./components/ExposedSecrets";
import { PATH_EXPOSED_SECRETS_FULL, routeExposedSecrets, type Search } from "./route";

export default function ExposedSecretsPageContent() {
  const params = routeExposedSecrets.useParams();
  const search = routeExposedSecrets.useSearch();
  const namespace = useClusterStore((state) => state.defaultNamespace);

  const handleSearchChange = (next: Search) =>
    void router.navigate({ to: PATH_EXPOSED_SECRETS_FULL, params, search: next });

  return (
    <PageWrapper breadcrumbs={[{ label: "Security" }, { label: "Findings" }, { label: "Exposed Secrets" }]}>
      <PageContentWrapper
        icon={KeyRound}
        title="Exposed Secrets"
        description="Secret findings of the platform in DefectDojo, in the code and in running workloads"
      >
        <ExposedSecrets
          search={search}
          onSearchChange={handleSearchChange}
          namespace={namespace}
          clusterName={params.clusterName}
        />
      </PageContentWrapper>
    </PageWrapper>
  );
}
