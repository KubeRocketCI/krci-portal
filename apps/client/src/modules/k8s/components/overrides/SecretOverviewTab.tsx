import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import type { KubeObjectBase, Secret } from "@my-project/shared";
import {
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";

interface SecretView {
  type?: string;
  data?: Record<string, string>;
  immutable?: boolean;
}

export function SecretOverviewTab({ item }: { item: KubeObjectBase }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const secret = item as Secret;
  const view = secret as SecretView;

  const data = view.data ?? {};
  const dataEntries = Object.entries(data);
  const dataKeyCount = dataEntries.length;
  const immutable = view.immutable === true;
  const created = secret.metadata?.creationTimestamp;

  const decode = (v: string) => {
    try {
      return atob(v);
    } catch {
      return v;
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard
          label="Type"
          value={<span className="font-mono text-xs break-all">{view.type ?? "—"}</span>}
          sub="Secret type"
        />
        <WorkloadSummaryCard label="Data Keys" value={dataKeyCount} sub="Entries" />
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
              <CardTitle className="text-base font-semibold">Data</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <ul className="space-y-1 text-sm">
                {dataEntries.length === 0 ? (
                  <li className="text-muted-foreground">—</li>
                ) : (
                  dataEntries.map(([k, v]) => (
                    <li key={k} className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[8rem] font-mono">{k}:</span>
                      <span className="flex-1 font-mono break-all">{revealed[k] ? decode(v) : "••••••••••••••••"}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRevealed((p) => ({ ...p, [k]: !p[k] }))}
                        aria-label={revealed[k] ? `Hide ${k}` : `Reveal ${k}`}
                      >
                        {revealed[k] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>

          <WorkloadInformationCard>
            <WorkloadInfoRow label="Type" mono>
              {view.type ?? "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Data Keys">{dataKeyCount}</WorkloadInfoRow>
            <WorkloadInfoRow label="Immutable">{immutable ? "Yes" : "No"}</WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {secret.metadata?.uid ?? "—"}
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
