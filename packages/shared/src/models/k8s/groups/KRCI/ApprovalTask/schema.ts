import z from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema } from "../../../common";

export const approvalTaskApproveSchema = z.object({
  approvedBy: z.string(),
  comment: z.string().optional(),
});

export const approvalTaskActionSchema = z.enum(["Pending", "Approved", "Rejected", "Canceled"]);

export const approvalTaskSpecSchema = z.object({
  action: approvalTaskActionSchema.default("Pending"),
  approve: approvalTaskApproveSchema.optional(),
  description: z.string().default("Proceed"),
});

export const approvalTaskSchema = kubeObjectBaseSchema.extend({
  spec: approvalTaskSpecSchema,
});

// export const approvalTaskDraftSchema = kubeObjectBaseDraftSchema.extend({
//   spec: approvalTaskSpecSchema,
// });
