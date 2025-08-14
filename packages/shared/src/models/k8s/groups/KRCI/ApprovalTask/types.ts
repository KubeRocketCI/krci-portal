import z from "zod";
import { approvalTaskActionSchema, approvalTaskSchema } from "./schema";

export type ApprovalTask = z.infer<typeof approvalTaskSchema>;
// export type ApprovalTaskDraft = z.infer<typeof approvalTaskDraftSchema>;

export type ApprovalTaskAction = z.infer<typeof approvalTaskActionSchema>;
