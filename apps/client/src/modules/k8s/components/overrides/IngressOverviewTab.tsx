import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tooltip } from "@/core/components/ui/tooltip";
import { TableUI, TableBodyUI, TableHeadUI, TableHeaderUI, TableRowUI, TableCellUI } from "@/core/components/ui/table";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import type { Ingress, KubeObjectBase } from "@my-project/shared";
import {
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";

interface IngressBackendView {
  service?: { name?: string; port?: { number?: number; name?: string } };
  resource?: { kind?: string; name?: string };
}

interface IngressPathView {
  path?: string;
  pathType?: string;
  backend?: IngressBackendView;
}

interface IngressRuleView {
  host?: string;
  http?: { paths?: IngressPathView[] };
}

interface IngressTLSView {
  hosts?: string[];
  secretName?: string;
}

interface IngressSpecView {
  ingressClassName?: string;
  defaultBackend?: IngressBackendView;
  rules?: IngressRuleView[];
  tls?: IngressTLSView[];
}

interface IngressStatusView {
  loadBalancer?: { ingress?: Array<{ ip?: string; hostname?: string }> };
}

function describeBackend(backend?: IngressBackendView): string {
  if (!backend) return "—";
  if (backend.service?.name) {
    const port = backend.service.port?.number ?? backend.service.port?.name;
    return port !== undefined ? `${backend.service.name}:${port}` : backend.service.name;
  }
  if (backend.resource?.name) {
    return `${backend.resource.kind ?? "Resource"}/${backend.resource.name}`;
  }
  return "—";
}

export function IngressOverviewTab({ item }: { item: KubeObjectBase }) {
  const ingress = item as Ingress;

  const spec = ingress.spec as IngressSpecView | undefined;
  const status = ingress.status as IngressStatusView | undefined;

  const rules = spec?.rules ?? [];
  const tls = spec?.tls ?? [];
  const ingressClass = spec?.ingressClassName ?? "—";
  const created = ingress.metadata?.creationTimestamp;

  const hosts = Array.from(new Set(rules.map((r) => r.host).filter((h): h is string => Boolean(h))));
  const tlsSecrets = tls.map((t) => t.secretName).filter((s): s is string => Boolean(s));

  const lbIngress = status?.loadBalancer?.ingress?.[0];
  const loadBalancer = lbIngress?.ip || lbIngress?.hostname || "—";

  const defaultBackend = describeBackend(spec?.defaultBackend);

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard label="Class" value={ingressClass} sub="Ingress class" />
        <WorkloadSummaryCard label="Rules" value={rules.length} sub="Routing rules" />
        <WorkloadSummaryCard label="Hosts" value={hosts.length} sub="Distinct hosts" />
        <WorkloadSummaryCard label="TLS" value={tls.length} sub="TLS entries" />
        <WorkloadSummaryCard label="Load Balancer" value={loadBalancer} sub="Address" />
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
          {rules.length > 0 && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold">Rules</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TableUI>
                  <TableHeaderUI>
                    <TableRowUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Host
                      </TableHeadUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Path
                      </TableHeadUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Backend
                      </TableHeadUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Port
                      </TableHeadUI>
                    </TableRowUI>
                  </TableHeaderUI>
                  <TableBodyUI>
                    {rules.flatMap((rule, ri) =>
                      (rule.http?.paths ?? [{ path: undefined, pathType: undefined, backend: undefined }]).map(
                        (p, pi) => (
                          <TableRowUI key={`${ri}-${pi}`}>
                            <TableCellUI className="px-4 py-2 font-mono text-sm">{rule.host ?? "*"}</TableCellUI>
                            <TableCellUI className="px-4 py-2 font-mono text-sm">{p.path ?? "—"}</TableCellUI>
                            <TableCellUI className="px-4 py-2 font-mono text-sm">
                              {p.backend?.service?.name ?? "—"}
                            </TableCellUI>
                            <TableCellUI className="px-4 py-2 font-mono text-sm">
                              {p.backend?.service?.port?.number ?? p.backend?.service?.port?.name ?? "—"}
                            </TableCellUI>
                          </TableRowUI>
                        )
                      )
                    )}
                  </TableBodyUI>
                </TableUI>
              </CardContent>
            </Card>
          )}

          {tls.length > 0 && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold">TLS</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TableUI>
                  <TableHeaderUI>
                    <TableRowUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Hosts
                      </TableHeadUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Secret
                      </TableHeadUI>
                    </TableRowUI>
                  </TableHeaderUI>
                  <TableBodyUI>
                    {tls.map((t, i) => (
                      <TableRowUI key={i}>
                        <TableCellUI className="px-4 py-2 font-mono text-sm">
                          {(t.hosts ?? []).join(", ") || "—"}
                        </TableCellUI>
                        <TableCellUI className="px-4 py-2 font-mono text-sm">{t.secretName ?? "—"}</TableCellUI>
                      </TableRowUI>
                    ))}
                  </TableBodyUI>
                </TableUI>
              </CardContent>
            </Card>
          )}

          <WorkloadInformationCard>
            <WorkloadInfoRow label="Ingress Class">{ingressClass}</WorkloadInfoRow>
            {spec?.defaultBackend && <WorkloadInfoRow label="Default Backend">{defaultBackend}</WorkloadInfoRow>}
            <WorkloadInfoRow label="Rules">{rules.length}</WorkloadInfoRow>
            <WorkloadInfoRow label="TLS Secrets" full>
              {tlsSecrets.length ? tlsSecrets.join(", ") : "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {ingress.metadata?.uid ?? "—"}
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
