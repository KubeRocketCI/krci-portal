import React from "react";
import { X } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import type { SelectOption } from "@/core/components/form";
import { podFilterControlNames, podPhaseValues } from "./constants";
import { usePodFilter } from "./hooks/usePodFilter";

export function PodFilter() {
  const { form, reset, isDefaultValue } = usePodFilter();

  const statusOptions: SelectOption[] = React.useMemo(
    () => [{ label: "All", value: "all" }, ...podPhaseValues.map((value) => ({ label: value, value }))],
    []
  );

  return (
    <>
      <div className="col-span-3">
        <form.AppField name={podFilterControlNames.SEARCH}>
          {(field) => <field.FormTextField label="Search" placeholder="Search pods" />}
        </form.AppField>
      </div>

      <div className="col-span-2">
        <form.AppField name={podFilterControlNames.STATUS}>
          {(field) => <field.FormSelect label="Status" options={statusOptions} placeholder="Select status" />}
        </form.AppField>
      </div>

      {!isDefaultValue && (
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
