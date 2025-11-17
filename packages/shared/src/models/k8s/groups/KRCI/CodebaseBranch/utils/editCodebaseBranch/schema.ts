import { z } from "zod";
import { codebaseBranchSchema } from "../../schema.js";

export const editCodebaseBranchInputSchema = z.object({
  pipelines: codebaseBranchSchema.shape.spec.shape.pipelines,
});
