import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { Shield } from "lucide-react";
import { useCallback } from "react";
import { useTrivyOverview } from "./hooks/useTrivyOverview";
import { useDiscoverTrivyNamespaces } from "./hooks/useDiscoverTrivyNamespaces";
import { SummaryWidgetRow } from "./components/SummaryWidgetRow";
import { SeverityBreakdownCard } from "./components/SeverityBreakdownCard";
import { SeverityPieChart } from "./components/SeverityPieChart";
import { TopVulnerableImages } from "./components/TopVulnerableImages";
import { QuickLinksSection } from "./components/QuickLinksSection";
import { NamespaceSelector, getValidNamespace } from "@/modules/platform/security/components/trivy";
import { routeTrivyOverview, PATH_TRIVY_OVERVIEW_FULL } from "./route";
import { router } from "@/core/router";

export default function TrivyOverviewPageContent() {
  const params = routeTrivyOverview.useParams();
  const search = routeTrivyOverview.useSearch();

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
        to: PATH_TRIVY_OVERVIEW_FULL,
        params,
        search: { namespace },
      });
    },
    [params]
  );

  const { data, isLoading, error } = useTrivyOverview({ namespace: selectedNamespace });

  return (
    <PageWrapper breadcrumbs={[{ label: "Security" }, { label: "Container Scanning" }, { label: "Overview" }]}>
      <Section
        icon={Shield}
        title="Trivy Security Overview"
        description={`Container image vulnerability analysis for namespace: ${selectedNamespace}`}
        actions={
          <NamespaceSelector
            value={selectedNamespace}
            onChange={handleNamespaceChange}
            namespaces={discoveredNamespaces}
            isLoading={isDiscoveringNamespaces}
          />
        }
      >
        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-800 dark:text-red-400">Failed to load vulnerability data</p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          )}

          {/* Row 1: Summary widgets - 4 cards */}
          <SummaryWidgetRow data={data} isLoading={isLoading} />

          {/* Row 2: Severity analysis - 2 columns */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SeverityBreakdownCard data={data} isLoading={isLoading} />
            <SeverityPieChart data={data} isLoading={isLoading} />
          </div>

          {/* Row 3: Top vulnerable images */}
          <TopVulnerableImages data={data} isLoading={isLoading} />

          {/* Row 4: Quick links */}
          <QuickLinksSection />
        </div>
      </Section>
    </PageWrapper>
  );
}
