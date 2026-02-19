import { Autocomplete, NamespaceAutocomplete, Select } from "@/core/components/form";
import { ValueOf } from "@/core/types/global";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { FilterTypeWithOptionAll } from "@/k8s/types";
import { Button } from "@/core/components/ui/button";
import {
  PipelineRun,
  pipelineRunLabels,
  pipelineRunStatus,
  PipelineType,
  getPipelineRunAnnotation,
  tektonResultAnnotations,
} from "@my-project/shared";
import React from "react";
import { pipelineRunFilterControlNames } from "./constants";
import { usePipelineRunFilter } from "./hooks/usePipelineRunFilter";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { Label } from "@/core/components/ui/label";
import { X } from "lucide-react";

export const PipelineRunFilter = ({
  pipelineRuns,
  pipelineRunTypes,
  filterControls,
}: {
  pipelineRuns: PipelineRun[];
  pipelineRunTypes: FilterTypeWithOptionAll<PipelineType>[];
  filterControls: ValueOf<typeof pipelineRunFilterControlNames>[];
}) => {
  const { form, reset } = usePipelineRunFilter();

  const codebaseOptions = React.useMemo(() => {
    const set = new Set(
      pipelineRuns?.map(({ metadata: { labels } }) => labels?.[pipelineRunLabels.codebase]).filter(Boolean)
    );

    return Array.from(set);
  }, [pipelineRuns]);

  const codebaseBranchOptions = React.useMemo(() => {
    const set = new Set(
      pipelineRuns
        ?.map((pipelineRun) => getPipelineRunAnnotation(pipelineRun, tektonResultAnnotations.gitBranch))
        .filter(Boolean)
    );
    return Array.from(set);
  }, [pipelineRuns]);

  const allowedNamespaces = useClusterStore(useShallow((state) => state.allowedNamespaces));
  const showNamespaceFilter = allowedNamespaces.length > 1;

  const namespaceOptions = React.useMemo(() => allowedNamespaces, [allowedNamespaces]);

  const pipelineTypeOptions = React.useMemo(
    () => [
      { label: "All", value: "all" },
      ...pipelineRunTypes.map((value) => ({ label: capitalizeFirstLetter(value), value })),
    ],
    [pipelineRunTypes]
  );

  const statusOptions = React.useMemo(
    () => [
      { label: "All", value: "all" },
      ...Object.values(pipelineRunStatus).map((v) => ({ label: capitalizeFirstLetter(String(v)), value: String(v) })),
    ],
    []
  );

  return (
    <>
      {filterControls.includes(pipelineRunFilterControlNames.PIPELINE_TYPE) && (
        <div className="col-span-2">
          <form.Field name="pipelineType">
            {(field) => <Select field={field} label="Type" options={pipelineTypeOptions} placeholder="Select type" />}
          </form.Field>
        </div>
      )}

      {filterControls.includes(pipelineRunFilterControlNames.STATUS) && (
        <div className="col-span-2">
          <form.Field name="status">
            {(field) => <Select field={field} label="Status" options={statusOptions} placeholder="Select status" />}
          </form.Field>
        </div>
      )}

      {filterControls.includes(pipelineRunFilterControlNames.CODEBASES) && (
        <div className="col-span-4">
          <form.Field name="codebases">
            {(field) => (
              <Autocomplete
                field={field}
                label="Codebases"
                placeholder="Select codebases"
                options={codebaseOptions}
                multiple
                freeSolo
                ChipProps={{ size: "small", color: "primary" }}
              />
            )}
          </form.Field>
        </div>
      )}

      {filterControls.includes(pipelineRunFilterControlNames.CODEBASE_BRANCHES) && (
        <div className="col-span-4">
          <form.Field name="codebaseBranches">
            {(field) => (
              <Autocomplete
                field={field}
                label="Branches"
                placeholder="Select branches"
                options={codebaseBranchOptions}
                multiple
                freeSolo
                ChipProps={{ size: "small", color: "primary" }}
              />
            )}
          </form.Field>
        </div>
      )}

      {showNamespaceFilter && filterControls.includes(pipelineRunFilterControlNames.NAMESPACES) && (
        <div className="col-span-3">
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
