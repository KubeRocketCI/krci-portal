import { X } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import type { ResourceDescriptor } from "../../../../registry/types";
import { useNamespaceFilterOptions } from "../../../../hooks/useNamespaceFilterOptions";
import { k8sListFilterControlNames } from "./constants";
import { useK8sListFilter } from "./hooks/useK8sListFilter";

interface Props {
  descriptor: ResourceDescriptor;
}

export function ListFilter({ descriptor }: Props) {
  const { form, reset, isDefaultValue } = useK8sListFilter();
  const { namespaceOptions, showNamespaceFilter } = useNamespaceFilterOptions();

  // Cluster-scoped resources have no namespace to filter by.
  const showNamespaces = showNamespaceFilter && !descriptor.config.clusterScoped;

  return (
    <>
      <div className="col-span-3">
        <form.AppField name={k8sListFilterControlNames.SEARCH}>
          {(field) => <field.FormTextField label="Search" placeholder={`Search ${descriptor.label.toLowerCase()}`} />}
        </form.AppField>
      </div>

      {showNamespaces && (
        <div className="col-span-4">
          <form.AppField name={k8sListFilterControlNames.NAMESPACES}>
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
