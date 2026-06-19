import { Badge } from "@/core/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { TableUI, TableBodyUI, TableHeadUI, TableHeaderUI, TableRowUI, TableCellUI } from "@/core/components/ui/table";
import type { NetIngress } from "../types";

interface IngressCardProps {
  ingress: NetIngress;
  onSelect: (resource: NetIngress) => void;
}

export function IngressCard({ ingress, onSelect }: IngressCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="cursor-pointer p-4 pb-2" onClick={() => onSelect(ingress)}>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base font-semibold hover:underline">{ingress.name}</CardTitle>
          {ingress.ingressClassName && (
            <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
              class: {ingress.ingressClassName}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <TableUI>
          <TableHeaderUI>
            <TableRowUI>
              <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">Host</TableHeadUI>
              <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">Path</TableHeadUI>
              <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">Backend</TableHeadUI>
              <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">Port</TableHeadUI>
              <TableHeadUI className="bg-muted text-muted-foreground px-3 py-2 text-xs">TLS</TableHeadUI>
            </TableRowUI>
          </TableHeaderUI>
          <TableBodyUI>
            {ingress.rules.map((rule, i) => (
              <TableRowUI key={i}>
                <TableCellUI className="px-3 py-2 font-mono text-xs">{rule.host ?? "*"}</TableCellUI>
                <TableCellUI className="px-3 py-2 font-mono text-xs">{rule.path ?? "/"}</TableCellUI>
                <TableCellUI className="px-3 py-2 font-mono text-xs">{rule.backendName ?? "—"}</TableCellUI>
                <TableCellUI className="px-3 py-2 font-mono text-xs">{rule.backendPort ?? "—"}</TableCellUI>
                <TableCellUI className="text-muted-foreground px-3 py-2 text-xs">{rule.tls ?? "—"}</TableCellUI>
              </TableRowUI>
            ))}
          </TableBodyUI>
        </TableUI>
      </CardContent>
    </Card>
  );
}
