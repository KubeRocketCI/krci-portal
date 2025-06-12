import { z } from "zod";
import { codebaseBranchSchema } from "../../schema";

export const editDefaultCodebaseBranchInputSchema = z.object({
  version: codebaseBranchSchema.shape.spec.shape.version,
});
