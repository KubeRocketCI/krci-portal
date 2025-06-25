import { Codebase } from "../../../Codebase/types";
import { CodebaseBranch } from "../../types";

export const checkIsDefaultBranch = (
  codebase: Codebase,
  codebaseBranch: CodebaseBranch
) => codebase.spec.defaultBranch === codebaseBranch.spec.branchName;
