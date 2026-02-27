import { Button } from "@/core/components/ui/button";
import { PIPELINE_LIST_FILTER_NAMES } from "./constants";
import { usePipelineFilter } from "./hooks/useFilter";
import { useClusterStore } from "@/k8s/store";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { usePipelineWatchList } from "@/k8s/api/groups/Tekton/Pipeline";
import { pipelineLabels, PipelineType } from "@my-project/shared";
import { Label } from "@/core/components/ui/label";
import { X } from "lucide-react";

export const PipelineFilter = () => {
  const { form, reset } = usePipelineFilter();

  const pipelineListWatch = usePipelineWatchList();
  const pipelines = pipelineListWatch.data.array;

  const allowedNamespaces = useClusterStore(useShallow((state) => state.allowedNamespaces));
  const showNamespaceFilter = allowedNamespaces.length > 1;

  const namespaceComboboxOptions = React.useMemo(
    () => allowedNamespaces.map((value) => ({ label: value, value })),
    [allowedNamespaces]
  );

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
    <>
      <div className="col-span-3">
        <form.AppField name={PIPELINE_LIST_FILTER_NAMES.SEARCH}>
          {(field) => <field.FormTextField label="Search" placeholder="Search pipelines" />}
        </form.AppField>
      </div>

      <div className="col-span-3">
        <form.AppField name={PIPELINE_LIST_FILTER_NAMES.PIPELINE_TYPE}>
          {(field) => <field.FormSelect label="Type" options={pipelineTypeOptions} placeholder="Select type" />}
        </form.AppField>
      </div>

      {showNamespaceFilter && (
        <div className="col-span-4">
          <form.AppField name={PIPELINE_LIST_FILTER_NAMES.NAMESPACES}>
            {(field) => (
              <field.FormCombobox
                options={namespaceComboboxOptions}
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
