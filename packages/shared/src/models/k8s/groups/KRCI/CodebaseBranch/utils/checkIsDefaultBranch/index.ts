import { Codebase } from "../../../Codebase/types.js";
import { CodebaseBranch } from "../../types.js";

export const checkIsDefaultBranch = (codebase: Codebase, codebaseBranch: CodebaseBranch) =>
  codebase.spec.defaultBranch === codebaseBranch.spec.branchName;
