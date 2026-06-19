import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import type { BackendTrafficPolicy, ClientTrafficPolicy, KubeObjectBase, SecurityPolicy } from "@my-project/shared";
import {
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";
import { mapPolicyByKind } from "@/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Networking/live/buildNetworkingData";
import { ConditionsTable } from "@/modules/k8s/components/ConditionsTable";
import type { KubeCondition } from "@my-project/shared";

export function PolicyOverviewTab({ item }: { item: KubeObjectBase }) {
  const net = mapPolicyByKind(item as SecurityPolicy | BackendTrafficPolicy | ClientTrafficPolicy);

  const created = item.metadata?.creationTimestamp;

  const accepted = net.ancestorConditions.find((c) => c.type === "Accepted");
  const acceptedStatus = accepted?.status ?? "—";

  const targetText = net.targetName ? `${net.targetKind}/${net.targetName}` : "—";

  // NetCondition is structurally compatible with KubeCondition:
  // both have type/status/reason/message; lastTransitionTime is optional in KubeCondition
  // and simply absent here, rendering as "—" in the table (acceptable).
  const conditions = net.ancestorConditions as unknown as KubeCondition[];

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard label="Kind" value={net.kind} sub="Policy kind" />
        <WorkloadSummaryCard label="Target" value={targetText} sub="Attached target" />
        <WorkloadSummaryCard label="Accepted" value={acceptedStatus} sub="Condition" />
        {net.configSummary && <WorkloadSummaryCard label="Config" value={net.configSummary} sub="Active features" />}
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
          {net.ancestorConditions.length > 0 && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold">Ancestor Conditions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ConditionsTable conditions={conditions} />
              </CardContent>
            </Card>
          )}

          <WorkloadInformationCard>
            <WorkloadInfoRow label="Kind">{net.kind}</WorkloadInfoRow>
            <WorkloadInfoRow label="Target">{targetText}</WorkloadInfoRow>
            <WorkloadInfoRow label="Accepted">{acceptedStatus}</WorkloadInfoRow>
            {net.configSummary && (
              <WorkloadInfoRow label="Config" full>
                {net.configSummary}
              </WorkloadInfoRow>
            )}
            <WorkloadInfoRow label="UID" mono full>
              {item.metadata?.uid ?? "—"}
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
