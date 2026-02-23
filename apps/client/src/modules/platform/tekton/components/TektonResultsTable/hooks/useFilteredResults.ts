import { TektonResult, tektonResultAnnotations } from "@my-project/shared";
import React from "react";
import { defaultFilterValues } from "../constants";
import { TektonResultsFilterValues } from "../types";

interface UseFilteredResultsProps {
  data: TektonResult[];
}

/**
 * Hook to manage client-side filtering of TektonResults
 * Provides filter state and filtered data
 */
export const useFilteredResults = ({ data }: UseFilteredResultsProps) => {
  const [filterValues, setFilterValues] = React.useState<TektonResultsFilterValues>(defaultFilterValues);

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      // Status filter
      if (filterValues.status !== "all" && item.summary?.status !== filterValues.status) {
        return false;
      }
      // Pipeline type filter
      if (filterValues.pipelineType !== "all") {
        const itemType = String(item.annotations?.[tektonResultAnnotations.pipelineType] || "");
        if (itemType !== filterValues.pipelineType) return false;
      }
      // Codebases filter
      if (filterValues.codebases.length > 0) {
        const itemCodebase = String(item.annotations?.[tektonResultAnnotations.codebase] || "");
        if (!filterValues.codebases.includes(itemCodebase)) return false;
      }
      // Codebase branches filter
      if (filterValues.codebaseBranches.length > 0) {
        const itemBranch = String(item.annotations?.[tektonResultAnnotations.codebaseBranch] || "");
        if (!filterValues.codebaseBranches.includes(itemBranch)) return false;
      }
      return true;
    });
  }, [data, filterValues]);

  return {
    filteredData,
    filterValues,
    setFilterValues,
  };
};
