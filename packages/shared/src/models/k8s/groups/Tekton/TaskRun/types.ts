import z from "zod";
import {
  reasonSchema,
  statusSchema,
  stepStateSchema,
  taskRunPhaseEnum,
  taskRunSchema,
  taskRunStepReasonFieldNameEnum,
  taskRunStepStatusFieldNameEnum,
} from "./schema.js";
import { taskRunStepStatusFieldName } from "./constants.js";

export type TaskRun = z.infer<typeof taskRunSchema>;
export type TaskRunStatus = z.infer<typeof statusSchema>;
export type TaskRunStatusReason = z.infer<typeof reasonSchema>;
export type TaskRunPhase = z.infer<typeof taskRunPhaseEnum>;

/** Minimal run shape the classifier reads. TaskRun and CustomRun satisfy it. */
export interface ClassifiableRun {
  metadata?: { annotations?: Record<string, string> };
  status?: {
    conditions?: { type: string; status?: string; reason?: string; message?: string; lastTransitionTime?: string }[];
    startTime?: string;
    completionTime?: string;
  };
}

/** getTaskRunStatus result. */
export type TaskRunStatusResult = {
  phase: TaskRunPhase;
  reason: string | undefined;
  message: string | undefined;
  lastTransitionTime: string | undefined;
  startTime: string | undefined;
  completionTime: string | undefined;
};
export type TaskRunStepState = z.infer<typeof stepStateSchema>;
export type TaskRunStepStatus = z.infer<typeof taskRunStepStatusFieldNameEnum>;
export type TaskRunStepReason = z.infer<typeof taskRunStepReasonFieldNameEnum>;
