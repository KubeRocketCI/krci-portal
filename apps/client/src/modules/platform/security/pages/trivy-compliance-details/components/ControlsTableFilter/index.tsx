import { Select } from "@/core/components/form";
import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import { SEVERITY_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from "@/modules/platform/security/constants";
import { X } from "lucide-react";
import { CONTROLS_TABLE_FILTER_NAMES } from "./constants";
import { useControlsTableFilter } from "./hooks/useFilter";

export function ControlsTableFilter() {
  const { form, reset } = useControlsTableFilter();

  return (
    <>
      <div className="col-span-3">
        <form.Field name={CONTROLS_TABLE_FILTER_NAMES.SEVERITY}>
          {(field) => (
            <Select field={field} label="Severity" options={SEVERITY_FILTER_OPTIONS} placeholder="All severities" />
          )}
        </form.Field>
      </div>

      <div className="col-span-3">
        <form.Field name={CONTROLS_TABLE_FILTER_NAMES.STATUS}>
          {(field) => (
            <Select field={field} label="Status" options={STATUS_FILTER_OPTIONS} placeholder="All statuses" />
          )}
        </form.Field>
      </div>

      {form.state.isDirty && (
        <div className="col-span-1 flex flex-col gap-2">
          <Label> </Label>
          <Button variant="secondary" onClick={reset} size="sm" className="mt-0.5">
            <X size={16} />
            Clear
          </Button>
        </div>
      )}
    </>
  );
}
