import { X } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import { nodeFilterControlNames } from "./constants";
import { useNodeFilter } from "./hooks/useNodeFilter";

export function NodeFilter() {
  const { form, reset, isDefaultValue } = useNodeFilter();

  return (
    <>
      <div className="col-span-3">
        <form.AppField name={nodeFilterControlNames.SEARCH}>
          {(field) => <field.FormTextField label="Search" placeholder="Search nodes" />}
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
