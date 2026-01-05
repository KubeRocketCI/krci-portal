import { SavedTableSettings } from "@/core/components/Table/components/TableSettings/types";
import { RequestError, ValueOf } from "@/core/types/global";
import { PipelineRun, PipelineType } from "@my-project/shared";
import { FilterTypeWithOptionAll } from "@/k8s/types";
import { pipelineRunFilterControlNames } from "./components/Filter/constants";

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
  filterControls?: ValueOf<typeof pipelineRunFilterControlNames>[];
}
