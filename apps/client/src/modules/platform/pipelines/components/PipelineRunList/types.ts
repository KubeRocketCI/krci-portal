import { SavedTableSettings } from "@/core/components/Table/components/TableSettings/types";
import { ControlName } from "@/core/providers/Filter/types";
import { RequestError, ValueOf } from "@/core/types/global";
import { PipelineRun, PipelineType } from "@my-project/shared";
import { pipelineRunFilterControlNames } from "./constants";

export type PipelineRunFilterControlNames = ValueOf<typeof pipelineRunFilterControlNames>;

export type PipelineRunFilterAllControlNames = ControlName<PipelineRunFilterControlNames>;

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
  pipelineRunTypes?: PipelineType[];
  filterControls?: PipelineRunFilterControlNames[];
}

export type MatchFunctions = {
  [key in PipelineRunFilterAllControlNames]?: (item: PipelineRun, value: string | string[]) => boolean;
};
