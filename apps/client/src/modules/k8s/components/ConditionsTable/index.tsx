import { Badge } from "@/core/components/ui/badge";
import { TableUI, TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI } from "@/core/components/ui/table";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { formatRelativeTime } from "@/core/utils/date-humanize";
import type { KubeCondition } from "@my-project/shared";

type Variant = "success" | "destructive" | "secondary";

// Condition types where status=True is the desirable outcome.
// "Progressing" is included because for a Deployment a rolling rollout reports
// Progressing=True as a healthy in-flight state; treating it as destructive
// would surface a red badge during every routine deploy.
const POSITIVE_TYPES = new Set([
  "Established",
  "NamesAccepted",
  "Ready",
  "Available",
  "Initialized",
  "ContainersReady",
  "PodScheduled",
  "Healthy",
  "Progressing",
  // Gateway API / Envoy Gateway — status=True is the healthy outcome
  // (surfaced by Gateway/HTTPRoute/SecurityPolicy/BackendTrafficPolicy/ClientTrafficPolicy).
  "Accepted",
  "Programmed",
  "ResolvedRefs",
]);

function variantFor(type: string, status: string): Variant {
  const positive = POSITIVE_TYPES.has(type);
  if (status === "True") return positive ? "success" : "destructive";
  if (status === "False") return positive ? "destructive" : "success";
  return "secondary";
}

export interface ConditionsTableProps {
  conditions: KubeCondition[];
}

export function ConditionsTable({ conditions }: ConditionsTableProps) {
  if (conditions.length === 0) {
    return <p className="text-muted-foreground py-4 text-sm">No conditions reported.</p>;
  }

  return (
    <TableUI>
      <TableHeaderUI>
        <TableRowUI>
          <TableHeadUI scope="col">Type</TableHeadUI>
          <TableHeadUI scope="col">Status</TableHeadUI>
          <TableHeadUI scope="col">Reason</TableHeadUI>
          <TableHeadUI scope="col">Last Transition</TableHeadUI>
          <TableHeadUI scope="col">Message</TableHeadUI>
        </TableRowUI>
      </TableHeaderUI>
      <TableBodyUI>
        {conditions.map((c, idx) => {
          const variant = variantFor(c.type, c.status);
          return (
            <TableRowUI key={`${c.type}-${idx}`}>
              <TableCellUI>
                <span data-variant={variant}>
                  <Badge variant={variant}>{c.type}</Badge>
                </span>
              </TableCellUI>
              <TableCellUI>{c.status}</TableCellUI>
              <TableCellUI>{c.reason ?? "—"}</TableCellUI>
              <TableCellUI>{c.lastTransitionTime ? formatRelativeTime(c.lastTransitionTime) : "—"}</TableCellUI>
              <TableCellUI className="max-w-md">
                <div className="w-full min-w-0">
                  <TextWithTooltip text={c.message ?? "—"} maxLineAmount={2} />
                </div>
              </TableCellUI>
            </TableRowUI>
          );
        })}
      </TableBodyUI>
    </TableUI>
  );
}
