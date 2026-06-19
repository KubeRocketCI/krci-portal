import { AlertTriangle } from "lucide-react";
import { Badge } from "@/core/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { TableUI, TableBodyUI, TableHeadUI, TableHeaderUI, TableRowUI, TableCellUI } from "@/core/components/ui/table";
import type { NetGateway, NetPolicy } from "../types";
import { StatusPill } from "./StatusPill";

interface GatewayCardProps {
  gateway: NetGateway;
  policies: NetPolicy[];
  onSelect: (resource: NetGateway) => void;
}

export function GatewayCard({ gateway, policies, onSelect }: GatewayCardProps) {
  const accepted = gateway.conditions.find((c) => c.type === "Accepted");
  const programmed = gateway.conditions.find((c) => c.type === "Programmed");

  const isAddressNotAssigned = programmed?.status === "False" && programmed?.reason === "AddressNotAssigned";

  const attachedPolicies = policies.filter((p) => p.targetName === gateway.name);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="cursor-pointer p-4 pb-2" onClick={() => onSelect(gateway)}>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base font-semibold hover:underline">{gateway.name}</CardTitle>
          <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
            class: {gateway.gatewayClassName}
          </Badge>
          {accepted && <StatusPill condition={accepted} label="Accepted" resourceGeneration={gateway.generation} />}
          {programmed && (
            <StatusPill condition={programmed} label="Programmed" resourceGeneration={gateway.generation} />
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-4 pt-2">
        {gateway.addresses.length > 0 ? (
          <div className="bg-muted/40 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-xs">
            <span className="text-muted-foreground font-medium">Address:</span>
            {gateway.addresses.map((a) => (
              <Badge key={`${a.type}:${a.value}`} variant="outline" className="bg-muted font-mono text-xs">
                {a.type}: {a.value}
              </Badge>
            ))}
            {isAddressNotAssigned && (
              <span className="text-muted-foreground/70 italic">
                no LoadBalancer IP — reachable via NodePort/ClusterIP (attach your target group here)
              </span>
            )}
          </div>
        ) : (
          isAddressNotAssigned && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <span className="text-amber-700">
                No external IP yet. Traffic served via ClusterIP/NodePort. This is expected in local/kind clusters —
                Envoy Gateway provisions a LoadBalancer Service that may be pending.
              </span>
            </div>
          )
        )}

        {attachedPolicies.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Gateway policies:</span>
            {attachedPolicies.map((p) => {
              const accepted = p.ancestorConditions.find((c) => c.type === "Accepted");
              const isAccepted = accepted?.status === "True";
              return (
                <Badge
                  key={p.name}
                  variant="outline"
                  className={
                    isAccepted
                      ? "border-green-500/40 bg-green-500/10 text-green-700"
                      : "border-destructive/40 bg-destructive/10 text-destructive"
                  }
                >
                  {p.kind}: {p.name}
                </Badge>
              );
            })}
          </div>
        )}

        <div>
          <div className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">Listeners</div>
          <TableUI>
            <TableHeaderUI>
              <TableRowUI>
                <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">Name</TableHeadUI>
                <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">Proto:Port</TableHeadUI>
                <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">Hostname</TableHeadUI>
                <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">TLS</TableHeadUI>
                <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">Routes</TableHeadUI>
                <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">Status</TableHeadUI>
              </TableRowUI>
            </TableHeaderUI>
            <TableBodyUI>
              {gateway.listeners.map((listener) => (
                <TableRowUI key={listener.name}>
                  <TableCellUI className="px-3 py-2 font-mono text-xs">{listener.name}</TableCellUI>
                  <TableCellUI className="px-3 py-2 font-mono text-xs">
                    {listener.protocol}:{listener.port}
                  </TableCellUI>
                  <TableCellUI className="text-muted-foreground px-3 py-2 font-mono text-xs">
                    {listener.hostname ?? "*"}
                  </TableCellUI>
                  <TableCellUI className="px-3 py-2 font-mono text-xs">
                    {listener.tlsSecret ? (
                      <Badge variant="outline" className="bg-muted text-xs">
                        Secret: {listener.tlsSecret}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCellUI>
                  <TableCellUI className="px-3 py-2 text-xs">{listener.attachedRoutes}</TableCellUI>
                  <TableCellUI className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {listener.conditions.map((c) => (
                        <StatusPill key={c.type} condition={c} label={c.type} resourceGeneration={gateway.generation} />
                      ))}
                    </div>
                  </TableCellUI>
                </TableRowUI>
              ))}
            </TableBodyUI>
          </TableUI>
        </div>
      </CardContent>
    </Card>
  );
}
