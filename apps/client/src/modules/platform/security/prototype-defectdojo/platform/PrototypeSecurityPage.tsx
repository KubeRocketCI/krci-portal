// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// The Security pages Overview, Vulnerability Reports and Exposed Secrets on DefectDojo. Each host
// route renders this page when `?variant=` is set and its Trivy custom resource page otherwise.
import { KeyRound, Shield, ShieldAlert, type LucideIcon } from "lucide-react";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { usePlatformScope } from "./hooks/usePlatformScope";
import { SecurityPrototypeView, type SecurityPrototypePage } from "./SecurityPrototypeView";
import type { SecurityOverviewVariantKey } from "./types";

const PAGE_META: Record<
  SecurityPrototypePage,
  { title: string; breadcrumb: string; description: string; icon: LucideIcon }
> = {
  overview: {
    title: "Security Findings Overview",
    breadcrumb: "Overview",
    description: "Findings of code, images and running workloads from DefectDojo, over all clusters and namespaces.",
    icon: Shield,
  },
  vulnerabilities: {
    title: "Vulnerabilities",
    breadcrumb: "Vulnerabilities",
    description: "Vulnerability findings of running workloads and of the codebases, from DefectDojo.",
    icon: ShieldAlert,
  },
  secrets: {
    title: "Exposed Secrets",
    breadcrumb: "Exposed Secrets",
    description: "Secrets found in source code and in running images, from DefectDojo. Values are never shown.",
    icon: KeyRound,
  },
};

export interface PrototypeSecurityPageProps {
  page: SecurityPrototypePage;
  variant: SecurityOverviewVariantKey;
  /** Search parameter `clusters`: comma-separated clusters. Unset: the clusters of the installation's Stages. */
  clusters: string | undefined;
  /** Search parameter `namespace`: the namespace the Vulnerabilities list starts on. */
  namespace?: string;
  onClustersChange: (clusters: string[]) => void;
}

export function PrototypeSecurityPage({
  page,
  variant,
  clusters,
  namespace,
  onClustersChange,
}: PrototypeSecurityPageProps) {
  const { scope, isLoading } = usePlatformScope();
  const meta = PAGE_META[page];
  const pickedClusters = clusters === undefined ? null : clusters.split(",").filter(Boolean);

  return (
    <PageWrapper breadcrumbs={[{ label: "Security" }, { label: "Findings" }, { label: meta.breadcrumb }]}>
      <PageContentWrapper icon={meta.icon} title={meta.title} description={meta.description}>
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <LoadingSpinner />
          </div>
        ) : (
          <SecurityPrototypeView
            page={page}
            variant={variant}
            scope={scope}
            pickedClusters={pickedClusters}
            initialNamespace={namespace}
            onClustersChange={onClustersChange}
          />
        )}
      </PageContentWrapper>
    </PageWrapper>
  );
}
