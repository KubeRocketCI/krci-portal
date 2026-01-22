import { CODEBASE_FORM_NAMES } from "./names";
import type { GitOpsFormInstance } from "./providers/form/context";

/**
 * Utility function to update gitUrlPath based on field values.
 * This is used by multiple field onChange listeners to avoid code duplication.
 */
export const updateGitUrlPath = (
  form: GitOpsFormInstance,
  _gitServer: string,
  gitRepoPath: string,
  name: string,
  isGerrit: boolean
) => {
  const newGitUrlPath = isGerrit ? `/${name}` : `${gitRepoPath}/${name}`;
  form.setFieldValue(CODEBASE_FORM_NAMES.GIT_URL_PATH, newGitUrlPath);
};
