import { useMemo } from "react";
import { DataTable } from "@/core/components/Table";
import { TABLE } from "@/k8s/constants/tables";
import { useControlColumns } from "../../hooks/useControlColumns";
import { ControlResult } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { ControlTableRow, toControlTableRow } from "../../types";
import { ControlsTableFilter } from "../ControlsTableFilter";
import { useControlsTableFilter } from "../ControlsTableFilter/hooks/useFilter";

interface ControlsTableProps {
  controls: ControlResult[];
  isLoading: boolean;
}

/**
 * ControlsTable component displays a filterable table of compliance controls.
 * Supports filtering by severity and status (pass/fail).
 */
export function ControlsTable({ controls, isLoading }: ControlsTableProps) {
  const columns = useControlColumns();
  const { filterFunction, form } = useControlsTableFilter();

  // Convert controls to table rows
  const controlRows: ControlTableRow[] = useMemo(() => {
    return controls.map(toControlTableRow);
  }, [controls]);

  // Check if any filters are active
  const hasActiveFilters = form.state.values.severity !== "all" || form.state.values.status !== "all";

  const tableSlots = useMemo(
    () => ({
      header: <ControlsTableFilter />,
    }),
    []
  );

  return (
    <DataTable<ControlTableRow>
      id={TABLE.TRIVY_COMPLIANCE_CONTROLS_LIST.id}
      data={controlRows}
      columns={columns}
      isLoading={isLoading}
      filterFunction={filterFunction}
      emptyListComponent={
        <EmptyList
          customText="No controls found"
          description={hasActiveFilters ? "No controls match the current filters" : "No compliance controls available"}
        />
      }
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
