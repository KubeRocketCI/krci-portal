import { TIME_RANGES, type TimeRange } from "@my-project/shared";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { PATH_PIPELINE_METRICS_FULL, routePipelineMetrics, type Search } from "../route";

const DEFAULT_TIME_RANGE = TIME_RANGES.TODAY;

export interface PipelineMetricsFilters {
  namespace: string;
  /** undefined means "all codebases" (no filter active). */
  codebase?: string;
  timeRange: TimeRange;
}

interface UsePipelineMetricsFiltersResult {
  filters: PipelineMetricsFilters;
  setCodebase: (codebase: string | undefined) => void;
  setTimeRange: (timeRange: TimeRange) => void;
}

// Default values are omitted from the URL so a plain selection keeps the link short.
function withCodebase(prev: Search, codebase: string | undefined): Search {
  const next = { ...prev };

  if (codebase) {
    next.codebase = codebase;
  } else {
    delete next.codebase;
  }

  return next;
}

function withTimeRange(prev: Search, timeRange: TimeRange): Search {
  const next = { ...prev };

  if (timeRange === DEFAULT_TIME_RANGE) {
    delete next.timeRange;
  } else {
    next.timeRange = timeRange;
  }

  return next;
}

export function usePipelineMetricsFilters(): UsePipelineMetricsFiltersResult {
  const { namespace } = routePipelineMetrics.useParams();
  const search = routePipelineMetrics.useSearch();
  const navigate = useNavigate({ from: PATH_PIPELINE_METRICS_FULL });

  const filters: PipelineMetricsFilters = {
    namespace,
    codebase: search.codebase,
    timeRange: search.timeRange ?? DEFAULT_TIME_RANGE,
  };

  // `replace: true` on both setters: filter changes shouldn't pollute history.
  const setCodebase = React.useCallback(
    (codebase: string | undefined) => {
      void navigate({ search: (prev) => withCodebase(prev, codebase), replace: true });
    },
    [navigate]
  );

  const setTimeRange = React.useCallback(
    (timeRange: TimeRange) => {
      void navigate({ search: (prev) => withTimeRange(prev, timeRange), replace: true });
    },
    [navigate]
  );

  return { filters, setCodebase, setTimeRange };
}
