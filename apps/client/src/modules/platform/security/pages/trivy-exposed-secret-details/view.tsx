import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { KeyRound } from "lucide-react";
import { routeTrivyExposedSecretDetails } from "./route";
import { PATH_TRIVY_EXPOSED_SECRETS_FULL } from "../trivy-exposed-secrets/route";
import { SecretHeader } from "./components/SecretHeader";
import { SecretsList } from "./components/SecretsList";
import { useExposedSecretReportWatchItem } from "@/k8s/api/groups/Trivy/ExposedSecretReport";
import { Badge } from "@/core/components/ui/badge";

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

  const artifact = report?.report?.artifact;
  const registryServer = report?.report?.registry?.server;
  const displayTitle = artifact
    ? `${registryServer ? registryServer + "/" : ""}${artifact.repository}:${artifact.tag || "latest"}`
    : name;
  const summary = report?.report.summary;
  const totalIssues = summary ? summary.criticalCount + summary.highCount + summary.mediumCount + summary.lowCount : -1;
  const actions = totalIssues === 0 ? <Badge variant="success">No Secrets Found</Badge> : undefined;

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
        <PageContentWrapper icon={KeyRound} title={name} description="Exposed secrets detected in this container image">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-600">Error Loading Report</h2>
              <p className="text-muted-foreground mt-2">{query.error.message}</p>
            </div>
          </div>
        </PageContentWrapper>
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
      <PageContentWrapper
        icon={KeyRound}
        title={displayTitle}
        enableCopyTitle
        description="Exposed secrets detected in this container image"
        actions={actions}
        subHeader={
          <div className="ml-12">
            <SecretHeader report={report} isLoading={isLoading} />
          </div>
        }
      >
        <SecretsList report={report} isLoading={isLoading} />
      </PageContentWrapper>
    </PageWrapper>
  );
}
