import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tooltip } from "@/core/components/ui/tooltip";
import { TableUI, TableBodyUI, TableHeadUI, TableHeaderUI, TableRowUI, TableCellUI } from "@/core/components/ui/table";
import { formatRelativeTime, formatTimestamp } from "@/core/utils/date-humanize/utils";
import type { Gateway, KubeObjectBase } from "@my-project/shared";
import {
  WorkloadInfoRow,
  WorkloadInformationCard,
  WorkloadOverviewSidebar,
  WorkloadSummaryCard,
  WorkloadSummaryGrid,
} from "../workload";
import { mapGateway } from "@/modules/platform/cdpipelines/pages/stage-details/components/Content/components/Networking/live/buildNetworkingData";

export function GatewayOverviewTab({ item }: { item: KubeObjectBase }) {
  const gw = item as Gateway;
  const net = mapGateway(gw, []);

  const created = gw.metadata?.creationTimestamp;

  const accepted = net.conditions.find((c) => c.type === "Accepted");
  const programmed = net.conditions.find((c) => c.type === "Programmed");

  const acceptedStatus = accepted?.status ?? "—";
  const programmedStatus = programmed?.status ?? "—";

  const addresses = net.addresses.length > 0 ? net.addresses.map((a) => `${a.type}: ${a.value}`).join(", ") : "—";

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkloadSummaryGrid>
        <WorkloadSummaryCard label="Class" value={net.gatewayClassName || "—"} sub="Gateway class" />
        <WorkloadSummaryCard label="Listeners" value={net.listeners.length} sub="Listener count" />
        <WorkloadSummaryCard label="Addresses" value={addresses} sub="Status addresses" />
        <WorkloadSummaryCard label="Accepted" value={acceptedStatus} sub="Condition" />
        <WorkloadSummaryCard label="Programmed" value={programmedStatus} sub="Condition" />
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
          {net.listeners.length > 0 && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold">Listeners</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TableUI>
                  <TableHeaderUI>
                    <TableRowUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Name
                      </TableHeadUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Port
                      </TableHeadUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Protocol
                      </TableHeadUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Hostname
                      </TableHeadUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Attached Routes
                      </TableHeadUI>
                      <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                        Status
                      </TableHeadUI>
                    </TableRowUI>
                  </TableHeaderUI>
                  <TableBodyUI>
                    {net.listeners.map((listener, idx) => {
                      const listenerReady = listener.conditions.find((c) => c.type === "Ready");
                      const listenerAccepted = listener.conditions.find((c) => c.type === "Accepted");
                      const statusCond = listenerReady ?? listenerAccepted ?? listener.conditions[0];
                      const statusText = statusCond ? `${statusCond.type}: ${statusCond.status}` : "—";
                      return (
                        <TableRowUI key={listener.name || String(idx)}>
                          <TableCellUI className="px-4 py-2 font-mono text-sm">{listener.name}</TableCellUI>
                          <TableCellUI className="px-4 py-2 font-mono text-sm">{listener.port}</TableCellUI>
                          <TableCellUI className="px-4 py-2 font-mono text-sm">{listener.protocol}</TableCellUI>
                          <TableCellUI className="px-4 py-2 font-mono text-sm">{listener.hostname ?? "*"}</TableCellUI>
                          <TableCellUI className="px-4 py-2 text-sm">{listener.attachedRoutes}</TableCellUI>
                          <TableCellUI className="px-4 py-2 text-sm">{statusText}</TableCellUI>
                        </TableRowUI>
                      );
                    })}
                  </TableBodyUI>
                </TableUI>
              </CardContent>
            </Card>
          )}

          <WorkloadInformationCard>
            <WorkloadInfoRow label="Gateway Class">{net.gatewayClassName || "—"}</WorkloadInfoRow>
            <WorkloadInfoRow label="Listeners">{net.listeners.length}</WorkloadInfoRow>
            <WorkloadInfoRow label="Accepted">{acceptedStatus}</WorkloadInfoRow>
            <WorkloadInfoRow label="Programmed">{programmedStatus}</WorkloadInfoRow>
            {net.addresses.length > 0 && (
              <WorkloadInfoRow label="Addresses" full>
                {addresses}
              </WorkloadInfoRow>
            )}
            <WorkloadInfoRow label="UID" mono full>
              {gw.metadata?.uid ?? "—"}
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
