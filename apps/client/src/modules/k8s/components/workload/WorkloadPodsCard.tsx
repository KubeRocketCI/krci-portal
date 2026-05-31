import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Tooltip } from "@/core/components/ui/tooltip";
import { formatRelativeTime } from "@/core/utils/date-humanize/utils";
import {
  getPodReadyCounts,
  getPodRestartCount,
  getPodStatusIcon,
  getPodStatusLabel,
} from "@/k8s/api/groups/Core/Pod/utils/getStatusIcon";
import type { Pod } from "@my-project/shared";

interface WorkloadPodsCardProps {
  pods: Pod[];
  isLoading?: boolean;
  emptyText?: string;
}

/**
 * Lists the pods owned by a workload: name + IP, status, ready, restarts, node, age.
 * Pair with the `useOwnedPods` hook.
 */
export function WorkloadPodsCard({ pods, isLoading, emptyText = "No pods." }: WorkloadPodsCardProps) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-baseline justify-between text-base font-semibold">
          <span>Pods</span>
          <span className="text-muted-foreground text-xs">{pods.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && pods.length === 0 ? (
          <div className="text-muted-foreground p-4 text-sm">Loading…</div>
        ) : pods.length === 0 ? (
          <div className="text-muted-foreground p-4 text-sm">{emptyText}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Ready</th>
                  <th className="px-4 py-2 font-medium">Restarts</th>
                  <th className="px-4 py-2 font-medium">Node</th>
                  <th className="px-4 py-2 font-medium">Age</th>
                </tr>
              </thead>
              <tbody>
                {pods.map((pod) => {
                  const icon = getPodStatusIcon(pod);
                  const { ready, total } = getPodReadyCounts(pod);
                  const created = pod.metadata?.creationTimestamp;
                  return (
                    <tr key={pod.metadata?.uid ?? pod.metadata?.name} className="border-b last:border-0">
                      <td className="px-4 py-2">
                        <div className="font-mono text-xs">{pod.metadata?.name}</div>
                        {pod.status?.podIP && (
                          <div className="text-muted-foreground font-mono text-[11px]">{pod.status.podIP}</div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon
                            Icon={icon.component}
                            color={icon.color}
                            isSpinning={icon.isSpinning}
                            width={14}
                          />
                          <span className="text-xs">{getPodStatusLabel(pod)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 tabular-nums">
                        {ready}/{total}
                      </td>
                      <td className="px-4 py-2 tabular-nums">{getPodRestartCount(pod)}</td>
                      <td className="px-4 py-2 font-mono text-xs">{pod.spec?.nodeName ?? "—"}</td>
                      <td className="text-muted-foreground px-4 py-2">
                        {created ? (
                          <Tooltip title={created}>
                            <span>{formatRelativeTime(created)}</span>
                          </Tooltip>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
