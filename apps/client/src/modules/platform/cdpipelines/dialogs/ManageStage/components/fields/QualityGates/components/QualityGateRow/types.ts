import { FormStageQualityGate } from "../../../../../types";
import { AutotestWithBranchesOption } from "../../types";

export interface QualityGateRowProps {
  autotestsWithBranchesOptions: AutotestWithBranchesOption[];
  currentQualityGate: FormStageQualityGate;
}
