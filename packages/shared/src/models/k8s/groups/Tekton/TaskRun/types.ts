import z from "zod";
import { reasonSchema, stepStateSchema, taskRunSchema } from "./schema";

export type TaskRun = z.infer<typeof taskRunSchema>;
export type TaskRunStepState = z.infer<typeof stepStateSchema>;
export type TaskRunStepReason = z.infer<typeof reasonSchema>;
