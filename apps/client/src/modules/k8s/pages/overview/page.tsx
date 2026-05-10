import { Bell, Box, Layers, Server } from "lucide-react";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useK8sResourceList } from "../../hooks/useK8sResourceList";
import { WatchConnectionIndicator, type WatchStatus } from "../../components/WatchConnectionIndicator";
import {
  k8sEventConfig,
  k8sNamespaceConfig,
  k8sNodeConfig,
  k8sPodConfig,
  k8sServiceConfig,
  type KubeObjectBase,
} from "@my-project/shared";
import type { RequestError } from "@/core/types/global";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: typeof Server;
  hasError?: boolean;
}

function MetricCard({ title, value, icon: Icon, hasError }: MetricCardProps) {
  return (
    <div className="bg-card flex items-center gap-3 rounded-md border p-4">
      <Icon className="text-muted-foreground" />
      <div>
        <p className="text-muted-foreground text-xs uppercase">{title}</p>
        <p className="text-xl font-semibold">{hasError ? "—" : value}</p>
      </div>
    </div>
  );
}

interface NodeStatus {
  conditions?: { type?: string; status?: string }[];
  capacity?: Record<string, string>;
}

interface K8sEventLike extends KubeObjectBase {
  type?: string;
  reason?: string;
  message?: string;
  lastTimestamp?: string;
  involvedObject?: { kind?: string; name?: string };
}

export default function K8sOverviewPage() {
  const nodes = useK8sResourceList<KubeObjectBase>(k8sNodeConfig, "");
  const pods = useK8sResourceList<KubeObjectBase>(k8sPodConfig, "");
  const namespaces = useK8sResourceList<KubeObjectBase>(k8sNamespaceConfig, "");
  const services = useK8sResourceList<KubeObjectBase>(k8sServiceConfig, "");
  const events = useK8sResourceList<K8sEventLike>(k8sEventConfig, "");

  const nodeItems = (nodes.data?.array ?? []) as KubeObjectBase[];
  const recentEvents = (events.data?.array ?? []).slice(0, 50);

  const firstError: RequestError | null =
    nodes.error ?? namespaces.error ?? services.error ?? pods.error ?? events.error ?? null;
  const watchStatus: WatchStatus = firstError ? "error" : "connected";

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Cluster" }, { label: "Overview" }]}
      headerSlot={<WatchConnectionIndicator status={watchStatus} />}
    >
      <PageContentWrapper icon={Layers} title="Cluster Overview">
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Nodes" value={nodeItems.length} icon={Server} hasError={!!nodes.error} />
          <MetricCard title="Pods" value={(pods.data?.array ?? []).length} icon={Box} hasError={!!pods.error} />
          <MetricCard
            title="Namespaces"
            value={(namespaces.data?.array ?? []).length}
            icon={Layers}
            hasError={!!namespaces.error}
          />
          <MetricCard
            title="Services"
            value={(services.data?.array ?? []).length}
            icon={Bell}
            hasError={!!services.error}
          />
        </div>
        <section className="border-t">
          <h3 className="bg-muted/30 text-muted-foreground px-4 py-2 text-xs font-semibold uppercase">Nodes</h3>
          {nodes.error ? (
            <div className="p-4">
              <ErrorContent error={nodes.error} />
            </div>
          ) : nodeItems.length === 0 ? (
            <p className="text-muted-foreground p-4 text-sm">No nodes.</p>
          ) : (
            <ul className="divide-y">
              {nodeItems.map((n) => {
                const status = (n as { status?: NodeStatus }).status;
                const ready = status?.conditions?.find((c) => c.type === "Ready");
                return (
                  <li key={n.metadata?.uid} className="px-4 py-2 text-sm">
                    <span className="font-mono">{n.metadata?.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {ready?.status === "True" ? "Ready" : "NotReady"} · CPU {status?.capacity?.cpu ?? "—"} · MEM{" "}
                      {status?.capacity?.memory ?? "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="border-t">
          <h3 className="bg-muted/30 text-muted-foreground px-4 py-2 text-xs font-semibold uppercase">Recent Events</h3>
          {events.error ? (
            <div className="p-4">
              <ErrorContent error={events.error} />
            </div>
          ) : recentEvents.length === 0 ? (
            <p className="text-muted-foreground p-4 text-sm">No events.</p>
          ) : (
            <ul className="divide-y">
              {recentEvents.map((e, i) => (
                <li key={i} className="px-4 py-2 text-sm">
                  <span
                    className={`mr-2 inline-block h-2 w-2 rounded-full ${
                      e.type === "Warning" ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    aria-hidden
                  />
                  <span className="font-mono">{e.reason}</span>
                  <span className="text-muted-foreground ml-2">
                    {e.involvedObject?.kind}/{e.involvedObject?.name}
                  </span>
                  <span className="ml-2">{e.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageContentWrapper>
    </PageWrapper>
  );
}
