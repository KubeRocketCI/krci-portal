import { z } from "zod";
import { codebaseBranchSchema } from "../../schema";

export const editCodebaseBranchInputSchema = z.object({
  pipelines: codebaseBranchSchema.shape.spec.shape.pipelines,
});
