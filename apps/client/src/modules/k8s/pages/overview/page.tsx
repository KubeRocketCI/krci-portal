import { LayoutDashboard } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { WatchConnectionIndicator } from "@/modules/k8s/components/WatchConnectionIndicator";
import { useClusterOverview } from "./hooks/useClusterOverview";
import { CapacityCard } from "./components/CapacityCard";
import { ClusterInfoBar } from "./components/ClusterInfoBar";
import { PodPhaseCard } from "./components/PodPhaseCard";
import { RecentEventsCard } from "./components/RecentEventsCard";
import { SectionHeading } from "./components/SectionHeading";
import { StatCards } from "./components/StatCards";
import { WorkloadStatusSection } from "./components/WorkloadStatusSection";

export default function K8sOverviewPage() {
  const { clusterName } = useParams({ strict: false }) as { clusterName?: string };
  const cluster = clusterName ?? "";
  const overview = useClusterOverview();

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Cluster" }, { label: "Overview" }]}
      headerSlot={<WatchConnectionIndicator status={overview.watchStatus} />}
    >
      <PageContentWrapper icon={LayoutDashboard} title="Cluster Overview">
        <div className="flex flex-col gap-6 pb-8">
          <ClusterInfoBar
            clusterName={cluster}
            kubernetesVersion={overview.clusterDetails.data?.gitVersion}
            platform={overview.clusterDetails.data?.platform}
            nodeCount={overview.nodes.data.array.length}
            loading={overview.clusterDetails.isLoading || overview.nodes.isLoading}
          />

          <section>
            <SectionHeading>At a glance</SectionHeading>
            <StatCards
              clusterName={cluster}
              nodes={overview.nodes}
              pods={overview.pods}
              namespaces={overview.namespaces}
              workloads={overview.workloads}
            />
          </section>

          <section>
            <SectionHeading>Health</SectionHeading>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <WorkloadStatusSection clusterName={cluster} workloads={overview.workloads} />
              </div>
              <PodPhaseCard result={overview.pods} />
            </div>
          </section>

          <section>
            <SectionHeading>Capacity</SectionHeading>
            <CapacityCard nodes={overview.nodes} pods={overview.pods} />
          </section>

          <section>
            <SectionHeading>Activity</SectionHeading>
            <RecentEventsCard clusterName={cluster} result={overview.events} />
          </section>
        </div>
      </PageContentWrapper>
    </PageWrapper>
  );
}
