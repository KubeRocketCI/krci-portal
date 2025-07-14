import { DialogProps } from "@/core/providers/Dialog/types";
import {
  CDPipeline,
  Stage,
  StageQualityGate,
  StageQualityGateType,
  StageSourceType,
  StageTriggerType,
} from "@my-project/shared";
import { NAMES } from "./names";

export type ManageStageDialogProps = DialogProps<{
  cdPipeline: CDPipeline;
  otherStages: Stage[];
  stage?: Stage;
}>;

export type FormStageQualityGate = StageQualityGate & { id: string };

export interface AutotestWithBranchesOption {
  name: string;
  branches: string[];
  disabled?: boolean;
}

type QualityGateFieldArrayKey = `quality-gate.${string}.${keyof StageQualityGate}`;

export type ManageStageFormValues = {
  [NAMES.NAME]: string;
  [NAMES.NAMESPACE]: string;
  [NAMES.DEPLOY_NAMESPACE]: string;
  [NAMES.DESCRIPTION]: string;
  [NAMES.QUALITY_GATES]: FormStageQualityGate[];
  [NAMES.SOURCE_LIBRARY_BRANCH]: string;
  [NAMES.SOURCE_LIBRARY_NAME]: string;
  [NAMES.SOURCE_TYPE]: StageSourceType;
  [NAMES.TRIGGER_TYPE]: StageTriggerType;
  [NAMES.ORDER]: number;
  [NAMES.CDPIPELINE]: string;
  [NAMES.CLUSTER_NAME]: string;
  [NAMES.TRIGGER_TEMPLATE]: string;
  [NAMES.CLEAN_TEMPLATE]: string;
  [NAMES.QUALITY_GATES_TYPE_ADD_CHOOSER]: string;
} & {
  [K in QualityGateFieldArrayKey]: K extends `${string}.${string}.qualityGateType`
    ? StageQualityGateType
    : K extends `${string}.${string}.stepName`
      ? string
      : K extends `${string}.${string}.autotestName`
        ? string
        : K extends `${string}.${string}.branchName`
          ? string
          : never;
};
