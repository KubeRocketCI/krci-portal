import { Stage, stageQualityGateType } from "@my-project/shared";
import React from "react";
import { EDIT_STAGE_FORM_NAMES } from "../constants";
import { v4 as uuidv4 } from "uuid";

export const useDefaultValues = (stage: Stage | undefined) => {
  return React.useMemo(() => {
    // Ensure qualityGates have IDs for form state management
    const qualityGates = stage?.spec.qualityGates?.map((gate) => ({
      id: uuidv4(), // Generate new ID for each quality gate
      qualityGateType: gate.qualityGateType,
      stepName: gate.stepName,
      autotestName: gate.autotestName,
      branchName: gate.branchName,
    })) || [
      {
        id: uuidv4(),
        qualityGateType: stageQualityGateType.manual,
        stepName: "approve",
        autotestName: null,
        branchName: null,
      },
    ];

    return {
      [EDIT_STAGE_FORM_NAMES.triggerType]: stage?.spec.triggerType || "",
      [EDIT_STAGE_FORM_NAMES.triggerTemplate]: stage?.spec.triggerTemplate || "",
      [EDIT_STAGE_FORM_NAMES.cleanTemplate]: stage?.spec.cleanTemplate || "",
      [EDIT_STAGE_FORM_NAMES.qualityGates]: qualityGates,
    };
  }, [stage]);
};
