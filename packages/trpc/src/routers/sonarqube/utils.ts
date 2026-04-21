export const notFoundMessage = (projectKey: string, pullRequest?: string, branch?: string): string => {
  if (pullRequest) return `pull request ${pullRequest} not found`;
  if (branch) return `branch ${branch} not found`;
  return `project ${projectKey} not found`;
};
