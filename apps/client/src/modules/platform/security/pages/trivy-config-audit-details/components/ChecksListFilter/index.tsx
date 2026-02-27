import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import { SEVERITY_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from "@/modules/platform/security/constants";
import { X } from "lucide-react";
import { CHECKS_LIST_FILTER_NAMES } from "./constants";
import { useChecksListFilter } from "./hooks/useFilter";

export function ChecksListFilter() {
  const { form, reset } = useChecksListFilter();

  return (
    <>
      <div className="col-span-3">
        <form.AppField name={CHECKS_LIST_FILTER_NAMES.SEVERITY}>
          {(field) => (
            <field.FormSelect label="Severity" options={SEVERITY_FILTER_OPTIONS} placeholder="All severities" />
          )}
        </form.AppField>
      </div>

      <div className="col-span-3">
        <form.AppField name={CHECKS_LIST_FILTER_NAMES.STATUS}>
          {(field) => <field.FormSelect label="Status" options={STATUS_FILTER_OPTIONS} placeholder="All statuses" />}
        </form.AppField>
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
