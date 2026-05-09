import React from "react";
import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { X } from "lucide-react";
import { TRIGGER_TEMPLATE_LIST_FILTER_NAMES } from "./constants";
import { useTriggerTemplateFilter } from "./hooks/useFilter";

export function TriggerTemplateFilter() {
  const { form, reset, isDefaultValue } = useTriggerTemplateFilter();
  const allowedNamespaces = useClusterStore(useShallow((s) => s.allowedNamespaces));
  const showNamespaceFilter = allowedNamespaces.length > 1;
  const namespaceOptions = React.useMemo(
    () => allowedNamespaces.map((value) => ({ label: value, value })),
    [allowedNamespaces]
  );

  return (
    <>
      <div className="col-span-3">
        <form.AppField name={TRIGGER_TEMPLATE_LIST_FILTER_NAMES.SEARCH}>
          {(field) => <field.FormTextField label="Search" placeholder="Search trigger templates" />}
        </form.AppField>
      </div>
      {showNamespaceFilter && (
        <div className="col-span-4">
          <form.AppField name={TRIGGER_TEMPLATE_LIST_FILTER_NAMES.NAMESPACES}>
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
