import { Editor } from "@monaco-editor/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import type { ConfigMap, KubeObjectBase } from "@my-project/shared";
import {
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";

interface ConfigMapView {
  data?: Record<string, string>;
  binaryData?: Record<string, string>;
  immutable?: boolean;
}

export function ConfigMapOverviewTab({ item }: { item: KubeObjectBase }) {
  const cm = item as ConfigMap & ConfigMapView;

  const data = cm.data ?? {};
  const binaryData = (cm as ConfigMapView).binaryData ?? {};
  const immutable = (cm as ConfigMapView).immutable ?? false;
  const created = cm.metadata?.creationTimestamp;

  const dataKeys = Object.keys(data).length;
  const binaryKeys = Object.keys(binaryData).length;
  const dataEntries = Object.entries(data);

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard label="Data Keys" value={dataKeys} sub="Entries" />
        <WorkloadSummaryCard label="Binary Keys" value={binaryKeys} sub="Binary entries" />
        <WorkloadSummaryCard label="Immutable" value={immutable ? "Yes" : "No"} sub="Mutability" />
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
                <span>Data</span>
                <span className="text-muted-foreground text-xs">{dataKeys}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {dataEntries.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data entries.</p>
              ) : (
                <div className="space-y-2">
                  {dataEntries.map(([k, v]) => (
                    <details key={k} className="bg-muted/30 rounded border">
                      <summary className="cursor-pointer px-3 py-2 font-mono text-sm">{k}</summary>
                      <div className="border-t">
                        <Editor
                          language="yaml"
                          theme="vs-light"
                          value={v}
                          height="240px"
                          options={{ readOnly: true, minimap: { enabled: false } }}
                        />
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <WorkloadInformationCard>
            <WorkloadInfoRow label="Data Keys">{dataKeys}</WorkloadInfoRow>
            <WorkloadInfoRow label="Binary Keys">{binaryKeys}</WorkloadInfoRow>
            <WorkloadInfoRow label="Immutable">{immutable ? "Yes" : "No"}</WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {cm.metadata?.uid ?? "—"}
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
