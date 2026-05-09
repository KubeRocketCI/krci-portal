import React from "react";
import { Webhook } from "lucide-react";
import { PageWrapper } from "@/core/components/PageWrapper";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Badge } from "@/core/components/ui/badge";
import { MetricCard } from "@/core/components/MetricCard";
import { EventFlowDiagram } from "@/modules/platform/tekton/components/EventFlowDiagram";
import { PATH_EVENT_LISTENERS_FULL } from "../event-listener-list/route";
import { useEventListenerDetailsData } from "./hooks/data";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export default function EventListenerDetailsView() {
  const { topology, params } = useEventListenerDetailsData();

  const triggersConfigured = topology.data ? topology.data.triggers.length : 0;
  const runs24h = React.useMemo(() => {
    const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;

    return topology.recentRuns.filter((pr) => {
      const ts = new Date(pr.metadata?.creationTimestamp ?? 0).getTime();
      return ts >= cutoff;
    }).length;
  }, [topology.recentRuns]);

  const subHeader = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {topology.data?.ready ? <Badge variant="success">Ready</Badge> : <Badge variant="destructive">Degraded</Badge>}
        {topology.data?.address && (
          <span className="text-muted-foreground">
            Address: <code className="font-mono text-xs">{topology.data.address}</code>
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <MetricCard title="Triggers configured" hasData={topology.isReady} isLoading={!topology.isReady}>
          <div className="text-3xl font-semibold">{triggersConfigured}</div>
        </MetricCard>
        <MetricCard
          title="Triggered runs · 24h"
          hasData={topology.recentRunsReady}
          isLoading={!topology.recentRunsReady}
        >
          <div className="text-3xl font-semibold">{runs24h}</div>
        </MetricCard>
      </div>
    </div>
  );

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Webhook Triggers" },
        { label: "Event Listeners", route: { to: PATH_EVENT_LISTENERS_FULL } },
        { label: params.name },
      ]}
    >
      <PageContentWrapper icon={Webhook} title={params.name} enableCopyTitle subHeader={subHeader}>
        <div className="flex flex-grow flex-col">
          <LoadingWrapper isLoading={!topology.isReady}>
            <EventFlowDiagram topology={topology.data} />
          </LoadingWrapper>
        </div>
      </PageContentWrapper>
    </PageWrapper>
  );
}
