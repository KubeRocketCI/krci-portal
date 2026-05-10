import { ResourceOverviewTab } from "../ResourceOverviewTab";
import { TableUI, TableBodyUI, TableHeadUI, TableHeaderUI, TableRowUI, TableCellUI } from "@/core/components/ui/table";
import type { KubeObjectBase } from "@my-project/shared";

interface IngressBackend {
  service?: { name?: string; port?: { number?: number; name?: string } };
}

interface IngressPath {
  path?: string;
  pathType?: string;
  backend?: IngressBackend;
}

interface IngressRule {
  host?: string;
  http?: { paths?: IngressPath[] };
}

interface IngressLike extends KubeObjectBase {
  spec?: {
    ingressClassName?: string;
    rules?: IngressRule[];
    tls?: Array<{ hosts?: string[]; secretName?: string }>;
  };
}

export function IngressOverviewTab({ item }: { item: KubeObjectBase }) {
  const ing = item as IngressLike;
  const rules = ing.spec?.rules ?? [];
  const tls = ing.spec?.tls ?? [];

  return (
    <div className="grid gap-4">
      <ResourceOverviewTab item={item} />

      {rules.length > 0 && (
        <section>
          <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">Rules</h3>
          <div className="bg-card rounded-md border">
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
                  (rule.http?.paths ?? [{ path: undefined, pathType: undefined, backend: undefined }]).map((p, pi) => (
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
                  ))
                )}
              </TableBodyUI>
            </TableUI>
          </div>
        </section>
      )}

      {tls.length > 0 && (
        <section>
          <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">TLS</h3>
          <div className="bg-card rounded-md border">
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
          </div>
        </section>
      )}
    </div>
  );
}
