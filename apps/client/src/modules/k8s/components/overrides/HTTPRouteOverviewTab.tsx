import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tooltip } from "@/core/components/ui/tooltip";
import { TableUI, TableBodyUI, TableHeadUI, TableHeaderUI, TableRowUI, TableCellUI } from "@/core/components/ui/table";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import type { HTTPRoute, KubeObjectBase } from "@my-project/shared";
import {
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";
import { mapHTTPRoute } from "@/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Networking/live/buildNetworkingData";

export function HTTPRouteOverviewTab({ item }: { item: KubeObjectBase }) {
  const route = item as HTTPRoute;
  const net = mapHTTPRoute(route);

  const created = route.metadata?.creationTimestamp;

  const firstParentConditions = net.parentConditions[0]?.conditions ?? [];
  const accepted = firstParentConditions.find((c) => c.type === "Accepted");
  const resolvedRefs = firstParentConditions.find((c) => c.type === "ResolvedRefs");

  const acceptedStatus = accepted?.status ?? "—";
  const resolvedRefsStatus = resolvedRefs?.status ?? "—";

  const parentsText =
    net.parentRefs.length > 0
      ? net.parentRefs.map((p) => (p.sectionName ? `${p.name}/${p.sectionName}` : p.name)).join(", ")
      : "—";

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard label="Hostnames" value={net.hostnames.length} sub="Distinct hostnames" />
        <WorkloadSummaryCard label="Rules" value={net.rules.length} sub="Routing rules" />
        <WorkloadSummaryCard label="Parents" value={parentsText} sub="Parent gateways" />
        <WorkloadSummaryCard label="Accepted" value={acceptedStatus} sub="Condition" />
        <WorkloadSummaryCard label="ResolvedRefs" value={resolvedRefsStatus} sub="Condition" />
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
          {net.rules.length > 0 && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold">Rules</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TableUI>
                  <TableHeaderUI>
                    <TableRowUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Hostname
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
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Weight
                      </TableHeadUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Filters
                      </TableHeadUI>
                    </TableRowUI>
                  </TableHeaderUI>
                  <TableBodyUI>
                    {net.rules.map((rule, i) => (
                      <TableRowUI key={`${i}-${rule.backendName ?? ""}-${rule.pathValue ?? ""}`}>
                        <TableCellUI className="px-4 py-2 font-mono text-sm">
                          {rule.hostnames[0] ?? net.hostnames[0] ?? "*"}
                        </TableCellUI>
                        <TableCellUI className="px-4 py-2 font-mono text-sm">
                          <span className="text-muted-foreground text-[10px]">
                            {rule.pathType === "PathPrefix" ? "Prefix" : (rule.pathType ?? "")}
                          </span>{" "}
                          {rule.pathValue ?? "/"}
                        </TableCellUI>
                        <TableCellUI className="px-4 py-2 font-mono text-sm">{rule.backendName || "—"}</TableCellUI>
                        <TableCellUI className="px-4 py-2 font-mono text-sm">
                          {rule.backendName ? rule.backendPort : "—"}
                        </TableCellUI>
                        <TableCellUI className="px-4 py-2 text-sm">
                          {rule.showWeight && rule.weight !== undefined ? `${rule.weight}%` : "—"}
                        </TableCellUI>
                        <TableCellUI className="px-4 py-2 text-sm">
                          {(rule.filters ?? []).map((f) => f.type).join(", ") || "—"}
                        </TableCellUI>
                      </TableRowUI>
                    ))}
                  </TableBodyUI>
                </TableUI>
              </CardContent>
            </Card>
          )}

          {net.parentConditions.length > 0 && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold">Parent Conditions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TableUI>
                  <TableHeaderUI>
                    <TableRowUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Parent
                      </TableHeadUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Condition
                      </TableHeadUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Status
                      </TableHeadUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Reason
                      </TableHeadUI>
                    </TableRowUI>
                  </TableHeaderUI>
                  <TableBodyUI>
                    {net.parentConditions.flatMap((pc) =>
                      pc.conditions.map((cond, ci) => (
                        <TableRowUI key={`${pc.parentName}-${ci}`}>
                          <TableCellUI className="px-4 py-2 font-mono text-sm">{pc.parentName}</TableCellUI>
                          <TableCellUI className="px-4 py-2 text-sm">{cond.type}</TableCellUI>
                          <TableCellUI className="px-4 py-2 text-sm">{cond.status}</TableCellUI>
                          <TableCellUI className="px-4 py-2 text-sm">{cond.reason ?? "—"}</TableCellUI>
                        </TableRowUI>
                      ))
                    )}
                  </TableBodyUI>
                </TableUI>
              </CardContent>
            </Card>
          )}

          <WorkloadInformationCard>
            <WorkloadInfoRow label="Hostnames" full>
              {net.hostnames.length > 0 ? net.hostnames.join(", ") : "—"}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Parent Gateways" full>
              {parentsText}
            </WorkloadInfoRow>
            <WorkloadInfoRow label="Rules">{net.rules.length}</WorkloadInfoRow>
            <WorkloadInfoRow label="Accepted">{acceptedStatus}</WorkloadInfoRow>
            <WorkloadInfoRow label="ResolvedRefs">{resolvedRefsStatus}</WorkloadInfoRow>
            <WorkloadInfoRow label="UID" mono full>
              {route.metadata?.uid ?? "—"}
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
