import { formatTimestamp } from "@/core/utils/date-humanize/utils";
import { TableUI, TableBodyUI, TableHeadUI, TableHeaderUI, TableRowUI, TableCellUI } from "@/core/components/ui/table";
import type { Node } from "@my-project/shared";

interface NodeStatus {
  conditions?: {
    type?: string;
    status?: string;
    reason?: string;
    lastTransitionTime?: string;
    message?: string;
  }[];
}

export function ConditionsTab({ node }: { node: Node }) {
  const conditions = (node as { status?: NodeStatus }).status?.conditions ?? [];
  if (conditions.length === 0) {
    return <div className="text-muted-foreground p-4 text-sm">No conditions reported.</div>;
  }
  return (
    <div className="p-4">
      <div className="bg-card rounded-md border">
        <TableUI>
          <TableHeaderUI>
            <TableRowUI>
              <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">Type</TableHeadUI>
              <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">Status</TableHeadUI>
              <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">Reason</TableHeadUI>
              <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                Last Transition
              </TableHeadUI>
              <TableHeadUI className="bg-muted text-muted-foreground px-4 py-2 text-xs font-medium">
                Message
              </TableHeadUI>
            </TableRowUI>
          </TableHeaderUI>
          <TableBodyUI>
            {conditions.map((c, i) => (
              <TableRowUI key={i}>
                <TableCellUI className="px-4 py-2 font-mono text-sm">{c.type ?? "—"}</TableCellUI>
                <TableCellUI className="px-4 py-2 text-sm">{c.status ?? "—"}</TableCellUI>
                <TableCellUI className="text-muted-foreground px-4 py-2 font-mono text-xs">
                  {c.reason ?? "—"}
                </TableCellUI>
                <TableCellUI className="px-4 py-2 text-xs">
                  {c.lastTransitionTime ? formatTimestamp(c.lastTransitionTime) : "—"}
                </TableCellUI>
                <TableCellUI className="px-4 py-2 text-xs break-all">{c.message ?? "—"}</TableCellUI>
              </TableRowUI>
            ))}
          </TableBodyUI>
        </TableUI>
      </div>
    </div>
  );
}
