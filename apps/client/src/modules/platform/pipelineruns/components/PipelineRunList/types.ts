import { SavedTableSettings } from "@/core/components/Table/components/TableSettings/types";
import { RequestError, ValueOf } from "@/core/types/global";
import { PipelineRun, PipelineType } from "@my-project/shared";
import { pipelineRunFilterControlNames } from "./constants";
import { FilterTypeWithOptionAll } from "@/k8s/types";

export type PipelineRunFilterControlNames = ValueOf<typeof pipelineRunFilterControlNames>;

export interface TableColumnBase {
  id: string;
  label: string;
}

export interface PipelineRunListProps {
  tableId: string;
  tableName: string;
  pipelineRuns: PipelineRun[];
  isLoading: boolean;
  tableSettings?: SavedTableSettings;
  blockerError?: RequestError;
  errors?: RequestError[] | null;
  pipelineRunTypes?: FilterTypeWithOptionAll<PipelineType>[];
  filterControls?: PipelineRunFilterControlNames[];
}

export type MatchFunctions = {
  [key in PipelineRunFilterControlNames]?: (item: PipelineRun, value: string | string[]) => boolean;
};
