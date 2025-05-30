import { gitProvider } from "../../../../KRCI";
import { PipelineRun } from "../../types";

export const getPullRequestURL = (
  pipelineRun: PipelineRun
): string | undefined => {
  const hasParams = pipelineRun?.spec?.params?.length > 0;

  const gitSourceUrl =
    hasParams &&
    pipelineRun?.spec?.params.find(
      (el: { name: string }) => el.name === "git-source-url"
    )?.value;

  const changeNumber =
    hasParams &&
    pipelineRun?.spec?.params.find(
      (el: { name: string }) => el.name === "changeNumber"
    )?.value;

  const gitProviderLabelValue =
    pipelineRun.metadata.labels?.["triggers.tekton.dev/trigger"]?.split(
      "-"
    )?.[0];

  if (!gitSourceUrl || !changeNumber || !gitProviderLabelValue) {
    return undefined;
  }

  const parts = gitSourceUrl.split(":");
  const host = parts[0].substring(4);
  const path = parts.slice(1).join("/").replace(".git", "");
  const url = new URL(`https://${host}/${path}`);

  if (gitSourceUrl.includes("edp-ci")) {
    // if gerrit
    return undefined;
  }

  switch (gitProviderLabelValue) {
    case gitProvider.github:
      url.pathname += `/pull/${changeNumber}`;
      break;
    case gitProvider.gitlab:
      url.pathname += `/merge_requests/${changeNumber}`;
      break;
    case gitProvider.bitbucket:
      url.pathname += `/pull-requests/${changeNumber}`;
      break;
    default:
      break;
  }

  return url.href;
};
