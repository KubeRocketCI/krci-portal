import { GitProvider, gitProvider } from "@my-project/shared";
import { createURLObjectFromURLOrigin } from "../utils";

export const GitURLService = {
  createGitOpsValuesYamlFileLink: (
    gitOpsWebUrl: string,
    pipelineName: string,
    stageName: string,
    appName: string,
    _gitProvider: GitProvider
  ) => {
    if (!gitOpsWebUrl) {
      return undefined;
    }

    const gitHostURLObject = createURLObjectFromURLOrigin(gitOpsWebUrl);

    if (_gitProvider === gitProvider.gerrit) {
      gitHostURLObject.searchParams.append("f", `${pipelineName}/${stageName}/${appName}-values.yaml`);
      gitHostURLObject.searchParams.append("hb", "refs/heads/main");
      gitHostURLObject.searchParams.append("a", "blob");

      return gitHostURLObject.href;
    } else if (_gitProvider === gitProvider.github || _gitProvider === gitProvider.gitlab) {
      return `${gitHostURLObject.href}/blob/main/${pipelineName}/${stageName}/${appName}-values.yaml`;
    } else if (_gitProvider === gitProvider.bitbucket) {
      return `${gitHostURLObject.href}/src/main/${pipelineName}/${stageName}/${appName}-values.yaml`;
    }
  },
  createRepoBranchLink: (codebaseGitProvider: GitProvider, baseUrl: string | undefined, branch: string) => {
    if (!codebaseGitProvider || !baseUrl) {
      return baseUrl;
    }

    const updatedUrl = new URL(baseUrl);

    switch (codebaseGitProvider.toLowerCase()) {
      case gitProvider.gerrit:
        updatedUrl.searchParams.set("a", "refs/heads/" + branch);
        break;
      case gitProvider.github:
        updatedUrl.pathname += `/tree/${branch}`;
        break;
      case gitProvider.gitlab:
        updatedUrl.pathname += `/-/tree/${branch}`;
        break;
      case gitProvider.bitbucket:
        updatedUrl.pathname += `/src/HEAD/`;
        updatedUrl.search = `?at=${encodeURIComponent(branch)}`;
        break;
      default:
        throw new Error(`Unsupported git server: ${codebaseGitProvider}`);
    }

    return updatedUrl.toString();
  },
};
