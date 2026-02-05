import { NamespaceAutocomplete, Select, SelectOption, TextField } from "@/core/components/form";
import { Button } from "@/core/components/ui/button";
import { codebaseType } from "@my-project/shared";
import { CODEBASE_LIST_FILTER_NAMES } from "./constants";
import { useCodebaseFilter } from "./hooks/useFilter";
import { useClusterStore } from "@/k8s/store";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { Label } from "@/core/components/ui/label";
import { X } from "lucide-react";

const codebaseTypeOptions: SelectOption[] = [
  { label: "All", value: "all" },
  ...Object.entries(codebaseType).map(([key, value]) => ({
    label: value,
    value: key,
  })),
];

export const CodebaseFilter = () => {
  const { form, reset } = useCodebaseFilter();

  const allowedNamespaces = useClusterStore(useShallow((state) => state.allowedNamespaces));
  const showNamespaceFilter = allowedNamespaces.length > 1;

  const namespaceOptions = React.useMemo(() => allowedNamespaces, [allowedNamespaces]);

  return (
    <>
      <div className="col-span-3">
        <form.Field name={CODEBASE_LIST_FILTER_NAMES.SEARCH}>
          {(field) => <TextField field={field} label="Search" placeholder="Search projects" />}
        </form.Field>
      </div>

      <div className="col-span-3">
        <form.Field name={CODEBASE_LIST_FILTER_NAMES.CODEBASE_TYPE}>
          {(field) => (
            <Select field={field} label="Project Type" options={codebaseTypeOptions} placeholder="Select type" />
          )}
        </form.Field>
      </div>

      {showNamespaceFilter && (
        <div className="col-span-4">
          <form.Field name={CODEBASE_LIST_FILTER_NAMES.NAMESPACES}>
            {(field) => (
              <NamespaceAutocomplete
                field={field}
                options={namespaceOptions}
                label="Namespaces"
                placeholder="Select namespaces"
              />
            )}
          </form.Field>
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
