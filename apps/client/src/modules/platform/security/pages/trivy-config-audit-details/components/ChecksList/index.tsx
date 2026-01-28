import { useMemo, useState } from "react";
import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import { useCheckColumns } from "../../hooks/useCheckColumns";
import { ConfigAuditReport } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { AlertTriangle, CheckCircle, XCircle, Wrench } from "lucide-react";
import { AuditCheckWithId } from "../../types";
import { ChecksListFilter } from "../ChecksListFilter";
import { useChecksListFilter } from "../ChecksListFilter/hooks/useFilter";

interface ChecksListProps {
  report: ConfigAuditReport | undefined;
  isLoading: boolean;
}

/**
 * Expanded row content showing check details
 */
function ExpandedCheckRow({ check }: { check: AuditCheckWithId }) {
  return (
    <div className="bg-muted/50 space-y-4 p-4">
      {/* Description */}
      {check.description && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">Description</span>
          </div>
          <p className="text-muted-foreground pl-6 text-sm">{check.description}</p>
        </div>
      )}

      {/* Messages */}
      {check.messages && check.messages.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">Messages</span>
          </div>
          <ul className="list-inside list-disc space-y-1 pl-6">
            {check.messages.map((message, index) => (
              <li key={index} className="text-muted-foreground text-sm">
                {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Remediation */}
      {check.remediation && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Remediation</span>
          </div>
          <p className="text-muted-foreground pl-6 text-sm">{check.remediation}</p>
        </div>
      )}

      {/* Show message if no detailed information available */}
      {!check.description && (!check.messages || check.messages.length === 0) && !check.remediation && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>No additional details available for this check.</span>
        </div>
      )}
    </div>
  );
}

/**
 * ChecksList component displays a table of configuration audit checks.
 * Supports filtering by severity and status (pass/fail).
 */
export function ChecksList({ report, isLoading }: ChecksListProps) {
  const columns = useCheckColumns();
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string | number>>(new Set());
  const { filterFunction, form } = useChecksListFilter();

  // Transform checks to include unique IDs
  const checksWithIds: AuditCheckWithId[] = useMemo(() => {
    if (!report?.report?.checks) {
      return [];
    }

    return report.report.checks.map((check, index) => ({
      ...check,
      id: `${check.checkID}-${index}`,
    }));
  }, [report?.report?.checks]);

  // Check if any filters are active
  const hasActiveFilters = form.state.values.severity !== "all" || form.state.values.status !== "all";

  const tableSlots = useMemo(
    () => ({
      header: <ChecksListFilter />,
    }),
    []
  );

  return (
    <DataTable<AuditCheckWithId>
      id={TABLE.TRIVY_CONFIG_AUDIT_CHECKS_LIST.id}
      data={checksWithIds}
      columns={columns}
      isLoading={isLoading}
      filterFunction={filterFunction}
      emptyListComponent={
        <EmptyList
          customText="No checks found"
          description={
            hasActiveFilters
              ? "Try adjusting your filters to see more checks"
              : "No configuration checks available for this resource"
          }
        />
      }
      expandable={{
        getRowId: (row) => row.id,
        expandedRowIds,
        onExpandedRowsChange: setExpandedRowIds,
        expandedRowRender: (row) => <ExpandedCheckRow check={row} />,
      }}
      sort={{
        order: "desc",
        sortBy: "severity",
      }}
      pagination={{
        show: true,
      }}
      settings={{
        show: true,
      }}
      slots={tableSlots}
    />
  );
}
