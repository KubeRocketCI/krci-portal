import { formatTimestamp } from "@/core/utils/date-humanize/utils";
import { Badge } from "@/core/components/ui/badge";
import { TableUI, TableBodyUI, TableHeadUI, TableHeaderUI, TableRowUI, TableCellUI } from "@/core/components/ui/table";
import type { Pod } from "@my-project/shared";

export function ConditionsTab({ pod }: { pod: Pod }) {
  const conditions = pod.status?.conditions ?? [];
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
                <TableCellUI className="px-4 py-2 font-mono text-sm">{c.type}</TableCellUI>
                <TableCellUI className="px-4 py-2">
                  <Badge
                    className={
                      c.status === "True"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : c.status === "False"
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                          : "bg-muted text-muted-foreground"
                    }
                  >
                    {c.status}
                  </Badge>
                </TableCellUI>
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
