import type { PipelineRunListFilterValues } from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/types";

export type PipelineRunViewFilters = Partial<PipelineRunListFilterValues>;

export interface PipelineRunView {
  id: string;
  name: string;
  /** Non-default filter values, in URL form. */
  filters: PipelineRunViewFilters;
  createdAt: number;
  updatedAt: number;
}

export interface PipelineRunViewsStore {
  version: 1;
  /** Views keyed by cluster name. A null-prototype object: read with `Object.hasOwn`. */
  clusters: Record<string, PipelineRunView[]>;
  /** Set when storage holds a format this build does not know; writes are refused to keep it. */
  readOnly?: true;
}
