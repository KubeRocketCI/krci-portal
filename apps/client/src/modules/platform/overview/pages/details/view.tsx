import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { IntegrationStatus } from "./components/IntegrationStatus";
import { PipelineHealthKPIs } from "./components/PipelineHealthKPIs";
import { PipelineActivityTrend } from "./components/PipelineActivityTrend";
import { RecentPipelineActivity } from "./components/RecentPipelineActivity";
import { ResourceHealth } from "./components/ResourceHealth";
import { SonarQubeQualitySummary } from "./components/SonarQubeQualitySummary";
import { DependencyTrackSummary } from "./components/DependencyTrackSummary";
import { DORAMetrics } from "./components/DORAMetrics";
import { MyRecentActivity } from "./components/MyRecentActivity";
import { ResourceUsage } from "./components/ResourceUsage";
import { GitActivity } from "./components/GitActivity";
import { QuickLinkList } from "./components/QuickLinkList";

export default function OverviewDetailsPageContent() {
  return (
    <PageWrapper breadcrumbs={[{ label: "Overview" }]} headerSlot={<LearnMoreLink url={EDP_USER_GUIDE.OVERVIEW.url} />}>
      <PageContentWrapper>
        <div className="flex flex-col gap-6 pb-6">
          <PipelineHealthKPIs />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <PipelineActivityTrend />
              <ResourceHealth />
              <RecentPipelineActivity />
              <MyRecentActivity />
              <GitActivity />
            </div>
            <div className="space-y-6 lg:col-span-1">
              <ResourceUsage />
              <DependencyTrackSummary />
              <SonarQubeQualitySummary />
              <IntegrationStatus />
              <DORAMetrics />
            </div>
          </div>

          <div>
            <p className="text-foreground mb-1 text-sm">Links</p>
            <p className="text-muted-foreground mb-3 text-xs">
              A set of icons with links that redirect you to corresponding tools.
            </p>
            <QuickLinkList />
          </div>
        </div>
      </PageContentWrapper>
    </PageWrapper>
  );
}
