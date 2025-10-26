import { NamespaceAutocomplete, Select, SelectOption, TextField } from "@/core/components/form";
import { Button } from "@mui/material";
import { codebaseType } from "@my-project/shared";
import { CODEBASE_LIST_FILTER_NAMES } from "./constants";
import { useCodebaseFilter } from "./hooks/useFilter";
import { useClusterStore } from "@/k8s/store";
import React from "react";
import { useShallow } from "zustand/react/shallow";

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
    <div className="flex items-start gap-4">
      <div className="w-64">
        <form.Field name={CODEBASE_LIST_FILTER_NAMES.SEARCH}>
          {(field) => <TextField field={field} label="Search" placeholder="Search components" />}
        </form.Field>
      </div>

      <div className="w-64">
        <form.Field name={CODEBASE_LIST_FILTER_NAMES.CODEBASE_TYPE}>
          {(field) => (
            <Select field={field} label="Codebase Type" options={codebaseTypeOptions} placeholder="Select type" />
          )}
        </form.Field>
      </div>

      {showNamespaceFilter && (
        <div className="w-[400px]">
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
        <div className="mt-4">
          <Button variant="outlined" onClick={reset} size="small">
            Clear
          </Button>
        </div>
      )}
    </div>
  );
};
