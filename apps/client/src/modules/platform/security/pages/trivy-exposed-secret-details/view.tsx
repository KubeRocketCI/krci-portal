import { PageWrapper } from "@/core/components/PageWrapper";
import { routeTrivyExposedSecretDetails } from "./route";
import { PATH_TRIVY_EXPOSED_SECRETS_FULL } from "../trivy-exposed-secrets/route";
import { SecretHeader } from "./components/SecretHeader";
import { SecretsList } from "./components/SecretsList";
import { useExposedSecretReportWatchItem } from "@/k8s/api/groups/Trivy/ExposedSecretReport";

export default function TrivyExposedSecretDetailsPageContent() {
  const { namespace, name, clusterName } = routeTrivyExposedSecretDetails.useParams();

  const {
    data: report,
    isLoading,
    query,
  } = useExposedSecretReportWatchItem({
    namespace,
    name,
  });

  if (query.error) {
    return (
      <PageWrapper
        breadcrumbs={[
          { label: "Security" },
          { label: "Container Scanning" },
          {
            label: "Exposed Secrets",
            route: {
              to: PATH_TRIVY_EXPOSED_SECRETS_FULL,
              params: { clusterName },
            },
          },
          { label: name },
        ]}
      >
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600">Error Loading Report</h2>
            <p className="text-muted-foreground mt-2">{query.error.message}</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Security" },
        { label: "Container Scanning" },
        {
          label: "Exposed Secrets",
          route: {
            to: PATH_TRIVY_EXPOSED_SECRETS_FULL,
            params: { clusterName },
          },
        },
        { label: "Secret Details" },
      ]}
    >
      <div className="space-y-4">
        <SecretHeader report={report} isLoading={isLoading} />
        <SecretsList report={report} isLoading={isLoading} />
      </div>
    </PageWrapper>
  );
}
