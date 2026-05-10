import type { KubeObjectBase } from "@my-project/shared";
import { NameValueTable } from "@/core/components/NameValueTable";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatTimestamp, formatUnixTimestamp } from "@/core/utils/date-humanize";
import { normalizeResourceValue } from "../../utils/normalizeResourceValue";

function SectionHeader({ title }: { title: string }) {
  return <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">{title}</h3>;
}

export function ResourceOverviewTab({ item }: { item: KubeObjectBase }) {
  const labels = item.metadata?.labels ?? {};
  const annotations = item.metadata?.annotations ?? {};
  const owners = item.metadata?.ownerReferences ?? [];

  const ts = item.metadata?.creationTimestamp;

  const metadataRows = [
    { name: "Name", value: item.metadata?.name ?? "—" },
    ...(item.metadata?.namespace ? [{ name: "Namespace", value: item.metadata.namespace }] : []),
    { name: "UID", value: <code className="font-mono text-xs">{item.metadata?.uid ?? "—"}</code> },
    {
      name: "Created at",
      value: ts ? (
        <Tooltip title={formatUnixTimestamp(ts)} delayDuration={500}>
          <span className="text-sm">{formatTimestamp(ts)}</span>
        </Tooltip>
      ) : (
        "—"
      ),
    },
  ];

  const labelRows = Object.entries(labels).map(([k, v]) => ({ name: k, value: v }));

  const annotationRows = Object.entries(annotations).map(([k, v]) => ({
    name: k,
    value: normalizeResourceValue(v),
  }));

  const ownerRows = owners.map((o) => ({
    name: o.kind,
    value: o.name,
  }));

  return (
    <div className="grid gap-6">
      <section>
        <SectionHeader title="Metadata" />
        <NameValueTable rows={metadataRows} />
      </section>

      {labelRows.length > 0 && (
        <section>
          <SectionHeader title="Labels" />
          <NameValueTable rows={labelRows} />
        </section>
      )}

      {annotationRows.length > 0 && (
        <section>
          <SectionHeader title="Annotations" />
          <NameValueTable rows={annotationRows} />
        </section>
      )}

      {ownerRows.length > 0 && (
        <section>
          <SectionHeader title="Owner References" />
          <NameValueTable rows={ownerRows} />
        </section>
      )}
    </div>
  );
}
