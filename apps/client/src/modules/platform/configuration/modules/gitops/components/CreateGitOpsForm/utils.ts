import { CODEBASE_FORM_NAMES } from "./constants";
import type { CreateGitOpsFormInstance } from "./providers/form/context";

export const updateGitUrlPath = (
  form: CreateGitOpsFormInstance,
  _gitServer: string,
  gitRepoPath: string,
  name: string,
  isGerrit: boolean
) => {
  const newGitUrlPath = isGerrit ? `/${name}` : `${gitRepoPath}/${name}`;
  form.setFieldValue(CODEBASE_FORM_NAMES.GIT_URL_PATH, newGitUrlPath);
};
