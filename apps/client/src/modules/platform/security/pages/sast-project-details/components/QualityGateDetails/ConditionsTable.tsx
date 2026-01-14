import { DataTable } from "@/core/components/Table";
import { EmptyList } from "@/core/components/EmptyList";
import { QualityGateCondition } from "@my-project/shared";
import { useConditionsColumns } from "../../hooks/useConditionsColumns";

interface ConditionsTableProps {
  conditions: QualityGateCondition[] | undefined;
}

export function ConditionsTable({ conditions }: ConditionsTableProps) {
  const columns = useConditionsColumns();

  if (!conditions || conditions.length === 0) {
    return <div className="text-muted-foreground py-8 text-center">No quality gate conditions configured</div>;
  }

  return (
    <DataTable
      id="quality-gate-conditions"
      data={conditions}
      columns={columns}
      emptyListComponent={<EmptyList missingItemName="No quality gate conditions configured" />}
      pagination={{
        show: false,
      }}
      outlined={false}
    />
  );
}
