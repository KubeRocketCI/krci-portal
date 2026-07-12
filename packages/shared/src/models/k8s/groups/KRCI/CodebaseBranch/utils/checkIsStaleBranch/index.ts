import { codebaseBranchLabels } from "../../labels.js";
import { CodebaseBranch } from "../../types.js";
import { getStaleCondition } from "../getStaleCondition/index.js";

export const checkIsStaleBranch = (
  codebaseBranch: CodebaseBranch,
  staleCondition = getStaleCondition(codebaseBranch)
) => {
  const staleLabel = codebaseBranch.metadata.labels?.[codebaseBranchLabels.stale];

  return staleLabel === "true" || staleCondition?.status === "True";
};
