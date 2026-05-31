import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import type { KubeObjectBase, Service } from "@my-project/shared";
import { useOwnedPods } from "../../hooks/useOwnedPods";
import {
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadPodsCard,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";

interface ServicePortView {
  name?: string;
  port: number;
  targetPort?: string | number;
  protocol?: string;
  nodePort?: number;
}

interface ServiceSpecView {
  type?: string;
  clusterIP?: string;
  clusterIPs?: string[];
  ports?: ServicePortView[];
  selector?: Record<string, string>;
  sessionAffinity?: string;
  externalTrafficPolicy?: string;
  ipFamilies?: string[];
}

interface LoadBalancerIngressView {
  ip?: string;
  hostname?: string;
}

interface ServiceStatusView {
  loadBalancer?: { ingress?: LoadBalancerIngressView[] };
}

function formatTargetPort(value?: string | number): string {
  return value === undefined || value === "" ? "—" : String(value);
}

function getExternalEndpoint(status?: ServiceStatusView): string | undefined {
  const ingress = status?.loadBalancer?.ingress ?? [];
  const first = ingress.find((i) => i.ip || i.hostname);
  return first?.ip ?? first?.hostname;
}

export function ServiceOverviewTab({ item }: { item: KubeObjectBase }) {
  const service = item as Service;

  const spec = service.spec as ServiceSpecView | undefined;
  const status = (service as { status?: ServiceStatusView }).status;

  const { pods, isLoading } = useOwnedPods(service, { fallbackLabels: spec?.selector ?? {} });

  const created = service.metadata?.creationTimestamp;
  const type = spec?.type ?? "ClusterIP";
  const clusterIP = spec?.clusterIP ?? "—";
  const clusterIPs = spec?.clusterIPs ?? [];
  const ports = spec?.ports ?? [];
  const selector = spec?.selector ?? {};
  const selectorKeys = Object.keys(selector);
  const externalEndpoint = getExternalEndpoint(status);
  const ingress = status?.loadBalancer?.ingress ?? [];

  const firstPort = ports[0];
  const firstPortSub = firstPort ? `${firstPort.port} → ${formatTargetPort(firstPort.targetPort)}` : undefined;

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard label="Type" value={type} sub="Service" />
        <WorkloadSummaryCard label="Cluster IP" value={<span className="font-mono">{clusterIP}</span>} sub="Internal" />
        <WorkloadSummaryCard label="Ports" value={ports.length} sub={firstPortSub ?? "—"} />
        <WorkloadSummaryCard label="Selector" value={selectorKeys.length} sub="labels" />
        <WorkloadSummaryCard label="External" value={externalEndpoint ?? "—"} sub="LoadBalancer" />
        <WorkloadSummaryCard
          label="Created"
          value={formatRelativeTime(created)}
          sub={
            created ? (
              <Tooltip title={created}>
                <span>{formatTimestamp(created)}</span>
              </Tooltip>
            ) : (
              "—"
            )
          }
        />
      </WorkloadSummaryGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-baseline justify-between text-base font-semibold">
                <span>Ports</span>
                <span className="text-muted-foreground text-xs">{ports.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ports.length === 0 ? (
                <div className="text-muted-foreground p-4 text-sm">No ports.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b text-left text-xs">
                        <th className="px-4 py-2 font-medium">Name</th>
                        <th className="px-4 py-2 font-medium">Port</th>
                        <th className="px-4 py-2 font-medium">Target</th>
                        <th className="px-4 py-2 font-medium">Protocol</th>
                        <th className="px-4 py-2 font-medium">NodePort</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ports.map((port, index) => (
                        <tr
                          key={`${port.name ?? index}-${port.port}-${port.protocol ?? "TCP"}`}
                          className="border-b last:border-0"
                        >
                          <td className="px-4 py-2 font-mono text-xs">{port.name ?? "—"}</td>
                          <td className="px-4 py-2 tabular-nums">{port.port}</td>
                          <td className="px-4 py-2 tabular-nums">{formatTargetPort(port.targetPort)}</td>
                          <td className="px-4 py-2 text-xs">{port.protocol ?? "TCP"}</td>
                          <td className="px-4 py-2 tabular-nums">{port.nodePort ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <WorkloadPodsCard pods={pods} isLoading={isLoading} emptyText="No backing pods." />

          <WorkloadInformationCard>
            <WorkloadInfoRow label="Type">{type}</WorkloadInfoRow>
            <WorkloadInfoRow label="Cluster IP(s)" mono>
              {clusterIPs.length ? clusterIPs.join(", ") : clusterIP}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Session Affinity">{spec?.sessionAffinity ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="External Traffic Policy">{spec?.externalTrafficPolicy ?? "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="IP Families">
              {spec?.ipFamilies?.length ? spec.ipFamilies.join(", ") : "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="LoadBalancer Ingress" mono>
              {ingress.length
                ? ingress
                    .map((i) => i.ip ?? i.hostname)
                    .filter(Boolean)
                    .join(", ")
                : "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Selector" mono full>
              {selectorKeys.length ? selectorKeys.map((k) => `${k}=${selector[k]}`).join(", ") : "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {service.metadata?.uid ?? "—"}
            </WorkloadInfoRow>
          </WorkloadInformationCard>
        </div>
        <div className="lg:col-span-1">
          <WorkloadOverviewSidebar item={item} />
        </div>
      </div>
    </div>
  );
}
