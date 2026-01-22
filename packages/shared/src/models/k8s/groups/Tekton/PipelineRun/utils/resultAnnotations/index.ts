export const RESULT_ANNOTATIONS_KEY = "results.tekton.dev/resultAnnotations";

export interface ResultAnnotations {
  "app.edp.epam.com/git-commit-sha": string;
  "app.edp.epam.com/git-branch": string;
  "app.edp.epam.com/git-target-branch": string;
  "app.edp.epam.com/git-change-number": string;
  "app.edp.epam.com/git-repository": string;
  "app.edp.epam.com/git-author": string;
  "app.edp.epam.com/git-avatar": string;
  "app.edp.epam.com/git-change-url": string;
}

export function createResultAnnotations(branchName: string, gitRepository: string): ResultAnnotations {
  return {
    "app.edp.epam.com/git-commit-sha": branchName,
    "app.edp.epam.com/git-branch": branchName,
    "app.edp.epam.com/git-target-branch": branchName,
    "app.edp.epam.com/git-change-number": "",
    "app.edp.epam.com/git-repository": gitRepository,
    "app.edp.epam.com/git-author": "",
    "app.edp.epam.com/git-avatar": "",
    "app.edp.epam.com/git-change-url": "",
  };
}
