import z from "zod";

const schema = z.object({
  buildPipeline: z.string().min(1, "Select Build pipeline"),
  reviewPipeline: z.string().min(1, "Select Review pipeline"),
  securityPipeline: z.string().default(""),
});

export const editCodebaseBranchSchema = schema;
