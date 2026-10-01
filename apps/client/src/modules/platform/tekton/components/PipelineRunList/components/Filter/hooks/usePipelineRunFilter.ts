import { useFilterContext } from "@/core/providers/Filter";
import React from "react";
import { CODEBASE_DIVIDER_VALUE } from "../constants";
import type { PipelineRunListFilterValues } from "../types";
import type { PipelineRunQueryFilters } from "@/modules/platform/tekton/hooks/useUnifiedPipelineRunList";
import { PipelineRun } from "@my-project/shared";
import { useStore } from "@tanstack/react-form";
import { useDebouncedValue } from "@/core/hooks/useDebouncedValue";

export const usePipelineRunFilter = () => useFilterContext<PipelineRun, PipelineRunListFilterValues>();

export const usePipelineRunQueryFilters = (): PipelineRunQueryFilters => {
  const { form } = usePipelineRunFilter();
  const values = useStore(form.store, (state) => state.values);
  const searchTerm = useDebouncedValue(values.search, 300);
  // Guard against a crafted URL injecting the sentinel into URL-synced filter state.
  const codebases = React.useMemo(
    () => values.codebases.filter((codebase) => codebase !== CODEBASE_DIVIDER_VALUE),
    [values.codebases]
  );

  return {
    searchTerm,
    status: values.status,
    pipelineType: values.pipelineType,
    codebases,
    namespaces: values.namespaces,
  };
};
