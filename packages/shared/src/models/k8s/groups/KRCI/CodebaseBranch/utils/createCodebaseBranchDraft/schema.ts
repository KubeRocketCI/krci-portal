import { z } from "zod";
import { codebaseBranchSchema } from "../../schema";

export const createCodebaseBranchDraftInputSchema = z.object({
  releaseBranchName:
    codebaseBranchSchema.shape.spec.shape.branchName.optional(),
  branchName: codebaseBranchSchema.shape.spec.shape.branchName,
  codebase: codebaseBranchSchema.shape.spec.shape.codebaseName,
  fromCommit: codebaseBranchSchema.shape.spec.shape.fromCommit,
  release: codebaseBranchSchema.shape.spec.shape.release,
  version: codebaseBranchSchema.shape.spec.shape.version,
  pipelines: codebaseBranchSchema.shape.spec.shape.pipelines,
});
