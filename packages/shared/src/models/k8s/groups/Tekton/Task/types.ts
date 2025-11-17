import z from "zod";
import { taskDraftSchema, taskSchema } from "./schema.js";

export type Task = z.infer<typeof taskSchema>;

export type TaskDraft = z.infer<typeof taskDraftSchema>;
