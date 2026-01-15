import { ZodError } from "zod";
import { codebaseBranchLabels } from "../../labels.js";
import { k8sCodebaseBranchConfig } from "../../constants.js";
import { codebaseBranchDraftSchema } from "../../schema.js";
import { CodebaseBranchDraft } from "../../types.js";
import { truncateName } from "../../../../../../../utils/truncateName.js";
import { createRandomString } from "../../../../../../../utils/createRandomString.js";
import { CreateCodebaseBranchDraftInput } from "./types.js";
import { createCodebaseBranchDraftInputSchema } from "./schema.js";

const { kind, apiVersion } = k8sCodebaseBranchConfig;

export const createCodebaseBranchDraftObject = (input: CreateCodebaseBranchDraftInput): CodebaseBranchDraft => {
  const parsedInput = createCodebaseBranchDraftInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const _branchName = input.release ? input.releaseBranchName : input.branchName;

  const transformedBranchName = _branchName
    ? _branchName
        .toLowerCase()
        .replaceAll("/", "-") // Replace forward slashes with a dash
        .replaceAll(".", "-") // Replace dots with a dash
        .replaceAll("_", "-") // Replace underscores with a dash
        .replace(/[^a-z0-9-]/g, "") // Replace any character that is NOT alphanumeric or dash
        .trim() // Trim white spaces at the start and end
        .replace(/-{2,}/g, "-") // Replace multiple consecutive dashes with a single dash (non-backtracking)
        .replace(/^-+/, "") // Remove leading dashes (no global flag needed)
        .replace(/-+$/, "") // Remove trailing dashes (no global flag needed)
    : "";

  const codebaseBranchName = `${input.codebase}-${transformedBranchName}`;

  const namePostfix = `-${createRandomString(5)}`;

  const truncatedName = truncateName(codebaseBranchName, namePostfix.length);

  const finalMetadataName = `${truncatedName}${namePostfix}`;

  const draft: CodebaseBranchDraft = {
    apiVersion,
    kind,

    metadata: {
      name: finalMetadataName,
      labels: {
        [codebaseBranchLabels.codebase]: input.codebase,
      },
    },
    spec: {
      branchName: _branchName || "my-codebase-branch",
      codebaseName: input.codebase,
      fromCommit: input.fromCommit,
      release: input.release,
      version: input.version,
      pipelines: input.pipelines,
    },
  };

  const parsedDraft = codebaseBranchDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
