import z from "zod";
import { approvalTaskSchema } from "./schema";

export type ApprovalTask = z.infer<typeof approvalTaskSchema>;
// export type ApprovalTaskDraft = z.infer<typeof approvalTaskDraftSchema>;
