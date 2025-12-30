import { PageWrapper } from "@/core/components/PageWrapper";
import { Section } from "@/core/components/Section";
import { Shield } from "lucide-react";
import { useState, useMemo } from "react";
import { DEFAULT_PORTFOLIO_METRICS_DAYS } from "@my-project/shared";
import { usePortfolioMetrics } from "./hooks/usePortfolioMetrics";
import { TimeRangeSelector } from "./components/TimeRangeSelector";
import { WidgetRow } from "./components/WidgetRow";
import { VulnerabilityTrendChart } from "./components/VulnerabilityTrendChart";
import { PolicyViolationsState } from "./components/PolicyViolationsState";
import { PolicyViolationsClassification } from "./components/PolicyViolationsClassification";
import { FindingsProgress } from "./components/FindingsProgress";
import { ViolationsProgress } from "./components/ViolationsProgress";
import { ProjectsChart } from "./components/ProjectsChart";
import { ComponentsChart } from "./components/ComponentsChart";
import { PortfolioStatistics } from "./components/PortfolioStatistics";

export default function SCAPageContent() {
  const [days, setDays] = useState<number>(DEFAULT_PORTFOLIO_METRICS_DAYS);

  const { data: metricsData, isLoading, isError, error } = usePortfolioMetrics({ days });

  // Memoize metrics array to prevent unnecessary re-renders in child components
  const memoizedMetrics = useMemo(() => metricsData, [metricsData]);

  return (
    <PageWrapper breadcrumbs={[{ label: "Security" }, { label: "SCA" }, { label: "Portfolio" }]}>
      <Section
        icon={Shield}
        title="Software Composition Analysis"
        description={`Portfolio vulnerability metrics and policy violations across all projects`}
        actions={<TimeRangeSelector value={days} onChange={setDays} />}
      >
        <div className="space-y-8">
          {isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">Failed to load metrics</p>
              <p className="mt-1 text-sm text-red-600">{error instanceof Error ? error.message : "Unknown error"}</p>
            </div>
          )}

          {/* Section 1: Top Widget Row */}
          <WidgetRow metrics={memoizedMetrics} isLoading={isLoading} />

          {/* Section 2: Portfolio Statistics */}
          <PortfolioStatistics metrics={memoizedMetrics} isLoading={isLoading} />

          {/* Section 3: Portfolio Vulnerabilities Chart */}
          <VulnerabilityTrendChart metrics={memoizedMetrics} isLoading={isLoading} />

          {/* Section 4: Policy Violations */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PolicyViolationsState metrics={memoizedMetrics} isLoading={isLoading} />
            <PolicyViolationsClassification metrics={memoizedMetrics} isLoading={isLoading} />
          </div>

          {/* Section 5: Auditing Progress */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FindingsProgress metrics={memoizedMetrics} isLoading={isLoading} />
            <ViolationsProgress metrics={memoizedMetrics} isLoading={isLoading} />
          </div>

          {/* Section 6: Vulnerable Assets */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ProjectsChart metrics={memoizedMetrics} isLoading={isLoading} />
            <ComponentsChart metrics={memoizedMetrics} isLoading={isLoading} />
          </div>
        </div>
      </Section>
    </PageWrapper>
  );
}
