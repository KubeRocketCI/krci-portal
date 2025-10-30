import { NamespaceAutocomplete, Select, TextField } from "@/core/components/form";
import { Button } from "@mui/material";
import { PIPELINE_LIST_FILTER_NAMES } from "./constants";
import { usePipelineFilter } from "./hooks/useFilter";
import { useClusterStore } from "@/k8s/store";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { usePipelineWatchList } from "@/k8s/api/groups/Tekton/Pipeline";
import { pipelineLabels, PipelineType } from "@my-project/shared";

export const PipelineFilter = () => {
  const { form, reset } = usePipelineFilter();

  const pipelineListWatch = usePipelineWatchList();
  const pipelines = pipelineListWatch.data.array;

  const allowedNamespaces = useClusterStore(useShallow((state) => state.allowedNamespaces));
  const showNamespaceFilter = allowedNamespaces.length > 1;

  const namespaceOptions = React.useMemo(() => allowedNamespaces, [allowedNamespaces]);

  const pipelineTypeOptions = React.useMemo(() => {
    const pipelineTypes = new Set(
      pipelines
        ?.map(({ metadata: { labels } }) => labels?.[pipelineLabels.pipelineType] as PipelineType)
        .filter(Boolean)
    );

    return [
      { label: "All", value: "all" },
      ...Array.from(pipelineTypes).map((value) => ({ label: capitalizeFirstLetter(value), value })),
    ];
  }, [pipelines]);

  return (
    <div className="flex items-start gap-4">
      <div className="w-64">
        <form.Field name={PIPELINE_LIST_FILTER_NAMES.SEARCH}>
          {(field) => <TextField field={field} label="Search" placeholder="Search pipelines" />}
        </form.Field>
      </div>

      <div className="w-64">
        <form.Field name={PIPELINE_LIST_FILTER_NAMES.PIPELINE_TYPE}>
          {(field) => <Select field={field} label="Type" options={pipelineTypeOptions} placeholder="Select type" />}
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
