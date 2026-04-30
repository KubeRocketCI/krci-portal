import type { SelectOption } from "@/core/components/form";
import { ValueOf } from "@/core/types/global";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { sortByName } from "@/core/utils/sortByName";
import { FilterTypeWithOptionAll } from "@/k8s/types";
import { Button } from "@/core/components/ui/button";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import {
  PipelineRun,
  pipelineRunLabels,
  pipelineRunStatus,
  PipelineType,
  getPipelineRunAnnotation,
  tektonResultAnnotations,
} from "@my-project/shared";

const pipelineRunStatusLabels: Record<string, string> = {
  [pipelineRunStatus.true]: "Succeeded",
  [pipelineRunStatus.false]: "Failed",
  [pipelineRunStatus.unknown]: "Running / Pending",
};
import React from "react";
import { CODEBASE_DIVIDER_VALUE, pipelineRunFilterControlNames } from "./constants";
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
  const { form, reset, isDefaultValue } = usePipelineRunFilter();

  const activeCodebases = React.useMemo(() => {
    const set = new Set(
      pipelineRuns?.map(({ metadata: { labels } }) => labels?.[pipelineRunLabels.codebase]).filter(Boolean) as string[]
    );

    return Array.from(set).sort(sortByName);
  }, [pipelineRuns]);

  const codebasesWatch = useCodebaseWatchList();
  const otherCodebases = React.useMemo(() => {
    const activeSet = new Set(activeCodebases);
    return codebasesWatch.data.array
      .map((codebase) => codebase.metadata.name)
      .filter((name): name is string => Boolean(name) && !activeSet.has(name))
      .sort(sortByName);
  }, [codebasesWatch.data.array, activeCodebases]);

  const codebaseBranchOptions = React.useMemo(() => {
    const set = new Set(
      pipelineRuns
        ?.map((pipelineRun) => getPipelineRunAnnotation(pipelineRun, tektonResultAnnotations.gitBranch))
        .filter(Boolean) as string[]
    );
    return Array.from(set);
  }, [pipelineRuns]);

  const allowedNamespaces = useClusterStore(useShallow((state) => state.allowedNamespaces));
  const showNamespaceFilter = allowedNamespaces.length > 1;

  const pipelineTypeOptions: SelectOption[] = React.useMemo(
    () => [
      { label: "All", value: "all" },
      ...pipelineRunTypes.map((value) => ({ label: capitalizeFirstLetter(value), value })),
    ],
    [pipelineRunTypes]
  );

  const statusOptions: SelectOption[] = React.useMemo(
    () => [
      { label: "All", value: "all" },
      ...Object.values(pipelineRunStatus).map((v) => ({
        label: pipelineRunStatusLabels[v] ?? capitalizeFirstLetter(String(v)),
        value: String(v),
      })),
    ],
    []
  );

  const codebaseComboboxOptions = React.useMemo<SelectOption[]>(() => {
    const activeOptions: SelectOption[] = activeCodebases.map((value) => ({ label: value, value }));
    const otherOptions: SelectOption[] = otherCodebases.map((value) => ({ label: value, value }));
    if (activeOptions.length === 0 || otherOptions.length === 0) {
      return [...activeOptions, ...otherOptions];
    }
    return [...activeOptions, { value: CODEBASE_DIVIDER_VALUE, label: "", kind: "separator" }, ...otherOptions];
  }, [activeCodebases, otherCodebases]);

  const branchComboboxOptions = React.useMemo(
    () => codebaseBranchOptions.map((value) => ({ label: value, value })),
    [codebaseBranchOptions]
  );

  const namespaceComboboxOptions = React.useMemo(
    () => allowedNamespaces.map((value) => ({ label: value, value })),
    [allowedNamespaces]
  );

  return (
    <>
      {filterControls.includes(pipelineRunFilterControlNames.SEARCH) && (
        <div className="col-span-3">
          <form.AppField name="search">
            {(field) => <field.FormTextField label="Search" placeholder="Search pipeline runs" />}
          </form.AppField>
        </div>
      )}

      {filterControls.includes(pipelineRunFilterControlNames.PIPELINE_TYPE) && (
        <div className="col-span-2">
          <form.AppField name="pipelineType">
            {(field) => <field.FormSelect label="Type" options={pipelineTypeOptions} placeholder="Select type" />}
          </form.AppField>
        </div>
      )}

      {filterControls.includes(pipelineRunFilterControlNames.STATUS) && (
        <div className="col-span-2">
          <form.AppField name="status">
            {(field) => <field.FormSelect label="Status" options={statusOptions} placeholder="Select status" />}
          </form.AppField>
        </div>
      )}

      {filterControls.includes(pipelineRunFilterControlNames.CODEBASES) && (
        <div className="col-span-4">
          <form.AppField name="codebases">
            {(field) => (
              <field.FormCombobox
                label="Codebases"
                placeholder="Select codebases"
                options={codebaseComboboxOptions}
                multiple
              />
            )}
          </form.AppField>
        </div>
      )}

      {filterControls.includes(pipelineRunFilterControlNames.CODEBASE_BRANCHES) && (
        <div className="col-span-2">
          <form.AppField name="codebaseBranches">
            {(field) => (
              <field.FormCombobox
                label="Branches"
                placeholder="Select branches"
                options={branchComboboxOptions}
                multiple
              />
            )}
          </form.AppField>
        </div>
      )}

      {showNamespaceFilter && filterControls.includes(pipelineRunFilterControlNames.NAMESPACES) && (
        <div className="col-span-2">
          <form.AppField name="namespaces">
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
};
