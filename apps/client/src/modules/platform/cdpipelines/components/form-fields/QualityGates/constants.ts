import { stageQualityGateType } from "@my-project/shared";
import { v4 as uuidv4 } from "uuid";

export const defaultQualityGate = {
  id: uuidv4(),
  qualityGateType: stageQualityGateType.manual,
  stepName: "approve",
  autotestName: null,
  branchName: null,
};
