import { Button } from "@/core/components/ui/button";
import { TASK_LIST_FILTER_NAMES } from "./constants";
import { useTaskFilter } from "./hooks/useFilter";
import { useClusterStore } from "@/k8s/store";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { Label } from "@/core/components/ui/label";
import { X } from "lucide-react";

export const TaskFilter = () => {
  const { form, reset } = useTaskFilter();

  const allowedNamespaces = useClusterStore(useShallow((state) => state.allowedNamespaces));
  const showNamespaceFilter = allowedNamespaces.length > 1;

  const namespaceOptions = React.useMemo(
    () => allowedNamespaces.map((value) => ({ label: value, value })),
    [allowedNamespaces]
  );

  return (
    <>
      <div className="col-span-3">
        <form.AppField name={TASK_LIST_FILTER_NAMES.SEARCH}>
          {(field) => <field.FormTextField label="Search" placeholder="Search tasks" />}
        </form.AppField>
      </div>

      {showNamespaceFilter && (
        <div className="col-span-4">
          <form.AppField name={TASK_LIST_FILTER_NAMES.NAMESPACES}>
            {(field) => (
              <field.FormCombobox
                options={namespaceOptions}
                label="Namespaces"
                placeholder="Select namespaces"
                multiple
              />
            )}
          </form.AppField>
        </div>
      )}

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
};
