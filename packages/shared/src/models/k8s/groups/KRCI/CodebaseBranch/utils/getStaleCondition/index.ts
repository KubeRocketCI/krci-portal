import { codebaseBranchConditionType } from "../../constants.js";
import { CodebaseBranch } from "../../types.js";

export const getStaleCondition = (codebaseBranch: CodebaseBranch) =>
  codebaseBranch.status?.conditions?.find((condition) => condition.type === codebaseBranchConditionType.stale);
