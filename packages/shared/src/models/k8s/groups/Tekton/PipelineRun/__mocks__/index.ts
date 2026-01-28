import { tektonResultAnnotations } from "../../../../../tektonResults/index.js";
import { pipelineRunLabels } from "../labels.js";
import { PipelineRun } from "../types.js";

// Helper to create mock PipelineRun data
export const createMockPipelineRun = (overrides: {
  name: string;
  pipelineType: string;
  status: "succeeded" | "failed" | "running" | "unknown";
  codebase?: string;
  branch?: string;
  pipelineName?: string;
  author?: string;
  pullRequest?: { number: string; url?: string };
  vcsTag?: string;
  startTime?: string;
  completionTime?: string;
  namespace?: string;
}): PipelineRun => {
  const now = new Date();
  const startTime = overrides.startTime || new Date(now.getTime() - 300000).toISOString(); // 5 minutes ago
  const completionTime =
    overrides.status === "running"
      ? undefined
      : overrides.completionTime || new Date(now.getTime() - 60000).toISOString();

  const statusCondition = {
    succeeded: { status: "True", reason: "Succeeded" },
    failed: { status: "False", reason: "Failed" },
    running: { status: "Unknown", reason: "Running" },
    unknown: { status: "Unknown", reason: "Unknown" },
  }[overrides.status];

  return {
    apiVersion: "tekton.dev/v1",
    kind: "PipelineRun",
    metadata: {
      name: overrides.name,
      namespace: overrides.namespace || "default",
      uid: `uid-${overrides.name}`,
      creationTimestamp: startTime,
      labels: {
        [pipelineRunLabels.pipelineType]: overrides.pipelineType,
        ...(overrides.codebase && { [pipelineRunLabels.codebase]: overrides.codebase }),
        ...(overrides.branch && { [pipelineRunLabels.codebaseBranch]: overrides.branch }),
        ...(overrides.pipelineName && { [pipelineRunLabels.pipeline]: overrides.pipelineName }),
      },
      annotations: {
        ...(overrides.branch && { [tektonResultAnnotations.gitBranch]: overrides.branch }),
        ...(overrides.author && { [tektonResultAnnotations.gitAuthor]: overrides.author }),
        ...(overrides.pullRequest && { [tektonResultAnnotations.gitChangeNumber]: overrides.pullRequest.number }),
        ...(overrides.pullRequest?.url && { [tektonResultAnnotations.gitChangeUrl]: overrides.pullRequest.url }),
      },
    },
    spec: {
      pipelineRef: {
        name: overrides.pipelineName || `pipeline-${overrides.pipelineType}`,
      },
      params: [],
    },
    status: {
      startTime,
      completionTime,
      conditions: [
        {
          type: "Succeeded",
          status: statusCondition.status,
          reason: statusCondition.reason as
            | "started"
            | "running"
            | "cancelled"
            | "succeeded"
            | "completed"
            | "failed"
            | "pipelineruntimeout"
            | "createrunfailed",
          message: `Pipeline run ${statusCondition.reason.toLowerCase()}`,
          lastTransitionTime: completionTime || startTime,
        },
      ],
      results: overrides.vcsTag
        ? [
            {
              name: "VCS_TAG",
              value: overrides.vcsTag,
            },
          ]
        : [],
    },
  } as PipelineRun;
};
