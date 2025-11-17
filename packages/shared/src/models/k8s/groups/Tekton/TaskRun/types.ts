import z from "zod";
import {
  reasonSchema,
  statusSchema,
  stepStateSchema,
  taskRunSchema,
  taskRunStepReasonFieldNameEnum,
  taskRunStepStatusFieldNameEnum,
} from "./schema.js";
import { taskRunStepStatusFieldName } from "./constants.js";

export type TaskRun = z.infer<typeof taskRunSchema>;
export type TaskRunStatus = z.infer<typeof statusSchema>;
export type TaskRunStatusReason = z.infer<typeof reasonSchema>;
export type TaskRunStepState = z.infer<typeof stepStateSchema>;
export type TaskRunStepStatus = z.infer<typeof taskRunStepStatusFieldNameEnum>;
export type TaskRunStepReason = z.infer<typeof taskRunStepReasonFieldNameEnum>;
