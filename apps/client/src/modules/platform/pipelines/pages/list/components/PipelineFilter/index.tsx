import { NamespaceAutocomplete, TextField } from "@/core/components/form";
import { Button } from "@mui/material";
import { PIPELINE_LIST_FILTER_NAMES } from "./constants";
import { usePipelineFilter } from "./hooks/useFilter";
import { useClusterStore } from "@/k8s/store";
import React from "react";
import { useShallow } from "zustand/react/shallow";

export const PipelineFilter = () => {
  const { form, reset } = usePipelineFilter();

  const allowedNamespaces = useClusterStore(useShallow((state) => state.allowedNamespaces));
  const showNamespaceFilter = allowedNamespaces.length > 1;

  const namespaceOptions = React.useMemo(() => allowedNamespaces, [allowedNamespaces]);

  return (
    <div className="flex items-start gap-4">
      <div className="w-64">
        <form.Field name={PIPELINE_LIST_FILTER_NAMES.SEARCH}>
          {(field) => <TextField field={field} label="Search" placeholder="Search pipelines" />}
        </form.Field>
      </div>

      {showNamespaceFilter && (
        <div className="w-[400px]">
          <form.Field name={PIPELINE_LIST_FILTER_NAMES.NAMESPACES}>
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
