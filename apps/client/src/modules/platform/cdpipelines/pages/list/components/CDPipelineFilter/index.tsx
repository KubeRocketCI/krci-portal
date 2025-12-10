import { useCDPipelineWatchList } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useCDPipelineFilter } from "./hooks/useCDPipelineFilter";
import { Autocomplete, NamespaceAutocomplete, TextField } from "@/core/components/form";
import { Button } from "@/core/components/ui/button";
import React from "react";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { Label } from "@/core/components/ui/label";
import { X } from "lucide-react";

export const CDPipelineFilter = () => {
  const { form, reset } = useCDPipelineFilter();

  const cdPipelineListWatch = useCDPipelineWatchList();

  const allowedNamespaces = useClusterStore(useShallow((state) => state.allowedNamespaces));
  const showNamespaceFilter = allowedNamespaces.length > 1;

  const namespaceOptions = React.useMemo(() => allowedNamespaces, [allowedNamespaces]);

  const cdPipelineCodebases = React.useMemo(() => {
    const list = cdPipelineListWatch.data.array ?? [];
    return Array.from(
      list.reduce((acc, cur) => {
        cur?.spec?.applications?.forEach((codebase) => acc.add(codebase));
        return acc;
      }, new Set<string>())
    );
  }, [cdPipelineListWatch.data.array]);

  return (
    <>
      <div className="col-span-3">
        <form.Field name="search" listeners={{ onChangeDebounceMs: 300 }}>
          {(field) => <TextField field={field} label="Search" placeholder="Search CD Pipelines" />}
        </form.Field>
      </div>

      <div className="col-span-4">
        <form.Field name="codebases">
          {(field) => (
            <Autocomplete
              field={field}
              multiple
              options={cdPipelineCodebases}
              freeSolo
              label="Codebases"
              placeholder="Select codebases"
              ChipProps={{ size: "small", color: "primary" }}
            />
          )}
        </form.Field>
      </div>

      {showNamespaceFilter && (
        <div className="col-span-4">
          <form.Field name="namespaces">
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
