import { StageQualityGate } from "@my-project/shared";

export type FormStageQualityGate = StageQualityGate & { id: string };

export interface QualityGateRowProps {
  namespace?: string;
  currentQualityGate: FormStageQualityGate;
}
