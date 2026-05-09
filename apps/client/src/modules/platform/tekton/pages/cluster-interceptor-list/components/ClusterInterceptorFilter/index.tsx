import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import { X } from "lucide-react";
import { CLUSTER_INTERCEPTOR_LIST_FILTER_NAMES } from "./constants";
import { useClusterInterceptorFilter } from "./hooks/useFilter";

export function ClusterInterceptorFilter() {
  const { form, reset, isDefaultValue } = useClusterInterceptorFilter();
  return (
    <>
      <div className="col-span-3">
        <form.AppField name={CLUSTER_INTERCEPTOR_LIST_FILTER_NAMES.SEARCH}>
          {(field) => <field.FormTextField label="Search" placeholder="Search cluster interceptors" />}
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
