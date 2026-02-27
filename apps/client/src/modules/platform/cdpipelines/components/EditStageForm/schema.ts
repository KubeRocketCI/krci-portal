import z from "zod";
import { EDIT_STAGE_FORM_NAMES } from "./constants";
import { stageQualityGateType } from "@my-project/shared";

const qualityGateSchema = z
  .object({
    id: z.string(),
    qualityGateType: z.nativeEnum(stageQualityGateType),
    stepName: z.string().min(1, "Step name is required"),
    autotestName: z.string().nullable(),
    branchName: z.string().nullable(),
  })
  .refine(
    (data) => {
      if (data.qualityGateType === stageQualityGateType.autotests) {
        return !!(data.autotestName && data.autotestName.trim().length > 0);
      }
      return true;
    },
    {
      message: "Autotest codebase is required for autotest quality gates",
      path: ["autotestName"],
    }
  )
  .refine(
    (data) => {
      if (data.qualityGateType === stageQualityGateType.autotests) {
        return !!(data.branchName && data.branchName.trim().length > 0);
      }
      return true;
    },
    {
      message: "Branch is required for autotest quality gates",
      path: ["branchName"],
    }
  );

const qualityGatesSchema = z
  .array(qualityGateSchema)
  .min(1, "At least one quality gate is required")
  .refine(
    (gates) => {
      const stepNames = gates.map((gate) => gate.stepName.trim()).filter((name) => name.length > 0);
      const uniqueStepNames = new Set(stepNames);
      return stepNames.length === uniqueStepNames.size;
    },
    {
      message: "Quality gate step names must be unique",
    }
  );

const schema = z.object({
  [EDIT_STAGE_FORM_NAMES.triggerType]: z.string().min(1, "Select trigger type"),
  [EDIT_STAGE_FORM_NAMES.triggerTemplate]: z.string().min(1, "Select Deploy Pipeline template"),
  [EDIT_STAGE_FORM_NAMES.cleanTemplate]: z.string().min(1, "Select Clean Pipeline template"),
  [EDIT_STAGE_FORM_NAMES.qualityGates]: qualityGatesSchema,
});

export const editStageSchema = schema;
