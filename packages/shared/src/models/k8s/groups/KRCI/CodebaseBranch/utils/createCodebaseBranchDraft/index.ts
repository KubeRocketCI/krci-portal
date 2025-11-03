import { ZodError } from "zod";
import { codebaseBranchLabels } from "../../labels";
import { k8sCodebaseBranchConfig } from "../../constants";
import { codebaseBranchDraftSchema } from "../../schema";
import { CodebaseBranchDraft } from "../../types";
import { truncateName } from "../../../../../../../utils/truncateName";
import { createRandomString } from "../../../../../../../utils/createRandomString";
import { CreateCodebaseBranchDraftInput } from "./types";
import { createCodebaseBranchDraftInputSchema } from "./schema";

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
        .replace(/--+/g, "-") // Replace multiple consecutive dashes with a single dash
        .replace(/^-+/g, "") // Custom handling without regex below
        .replace(/-+$/g, "")
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
