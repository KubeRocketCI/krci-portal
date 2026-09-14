import {
  ciTool,
  codebaseBranchLabels,
  createBuildPipelineRunDraft,
  k8sCodebaseBranchConfig,
  k8sCodebaseConfig,
  k8sGitServerConfig,
  k8sPipelineConfig,
  k8sTriggerTemplateConfig,
  triggerTemplateName,
  type Codebase,
  type CodebaseBranch,
  type GitServer,
  type Pipeline,
  type PipelineRun,
  type TriggerTemplate,
} from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { K8sClient } from "../../clients/k8s/index.js";
import { getResourceOrThrowNotFound, getResourceOrUndefined, listCompleteOrThrow } from "./lookup.js";

export interface ResolveBuildDraftInput {
  namespace: string;
  codebase: string;
  /** Git branch name. Falls back to `codebase.spec.defaultBranch` when absent. */
  branch?: string;
}

export interface ResolvedBuildDraft {
  draft: PipelineRun;
  codebaseBranch: CodebaseBranch;
}

/**
 * Resolve the inputs of `createBuildPipelineRunDraft` from a project name and
 * a branch name; render the draft. Steps run sequentially, each throwing
 * before the next: step order is the error-precedence contract of
 * `pipelineRun.build`.
 *
 * The returned draft carries the builder's `metadata.name`. Pinning the
 * namespace and swapping in a `generateName` is the caller's job.
 */
export async function resolveBuildDraft(
  k8sClient: K8sClient,
  { namespace, codebase: codebaseName, branch }: ResolveBuildDraftInput
): Promise<ResolvedBuildDraft> {
  const codebase = await getResourceOrThrowNotFound<Codebase>(
    () => k8sClient.getResource(k8sCodebaseConfig, codebaseName, namespace) as Promise<Codebase>,
    `codebase '${codebaseName}' not found`,
    "codebase_not_found"
  );

  // GitLab CI codebases build through GitFusion, which has no REST route yet.
  if (codebase.spec.ciTool === ciTool.gitlab) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `codebase '${codebaseName}' builds via GitLab CI, which this endpoint does not trigger`,
      cause: { source: "validation" as const, reason: "gitlab_ci_not_supported" },
    });
  }

  const branchName = branch || codebase.spec.defaultBranch;

  if (!branchName) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `codebase '${codebaseName}' has no default branch`,
      cause: { source: "validation" as const, reason: "branch_not_specified" },
    });
  }

  // CodebaseBranch metadata.name is unpredictable: the portal appends a random
  // suffix, manifests do not. Match on spec.branchName within the codebase's
  // branches.
  const codebaseBranches = await listCompleteOrThrow<CodebaseBranch>(
    k8sClient,
    k8sCodebaseBranchConfig,
    namespace,
    `${codebaseBranchLabels.codebase}=${codebaseName}`
  );

  const matchingBranches = codebaseBranches.filter((item) => item.spec?.branchName === branchName);

  if (matchingBranches.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `branch '${branchName}' of codebase '${codebaseName}' not found`,
      cause: { source: "validation" as const, reason: "codebase_branch_not_found" },
    });
  }

  // Two CodebaseBranches claiming one git branch is a platform defect; either
  // choice could build the wrong one. Fail closed.
  if (matchingBranches.length > 1) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `branch '${branchName}' of codebase '${codebaseName}' matches more than one CodebaseBranch`,
      cause: { source: "validation" as const, reason: "codebase_branch_ambiguous" },
    });
  }

  const codebaseBranch = matchingBranches[0];
  const buildPipelineName = codebaseBranch.spec?.pipelines?.build;

  if (!buildPipelineName) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `branch '${branchName}' of codebase '${codebaseName}' has no build pipeline configured`,
      cause: { source: "validation" as const, reason: "build_pipeline_not_configured" },
    });
  }

  const gitServer = await getResourceOrThrowNotFound<GitServer>(
    () => k8sClient.getResource(k8sGitServerConfig, codebase.spec.gitServer, namespace) as Promise<GitServer>,
    `codebase '${codebaseName}' references a git server that does not exist`,
    "git_server_not_found"
  );

  const buildTriggerTemplateName = triggerTemplateName(gitServer.spec.gitProvider, "build");

  const triggerTemplate = await getResourceOrThrowNotFound<TriggerTemplate>(
    () =>
      k8sClient.getResource(k8sTriggerTemplateConfig, buildTriggerTemplateName, namespace) as Promise<TriggerTemplate>,
    `build TriggerTemplate for codebase '${codebaseName}' does not exist`,
    "trigger_template_not_found"
  );

  const resourceTemplate = triggerTemplate.spec?.resourcetemplates?.[0];

  if (!resourceTemplate) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `build TriggerTemplate for codebase '${codebaseName}' carries no resourcetemplates`,
      cause: { source: "validation" as const, reason: "build_template_misconfigured" },
    });
  }

  // Read for its app.edp.epam.com/service-account annotation only. A missing
  // Pipeline is tolerated: the builder falls back to the TriggerTemplate's
  // serviceAccount default, same as the UI.
  const pipeline = await getResourceOrUndefined<Pipeline>(
    () => k8sClient.getResource(k8sPipelineConfig, buildPipelineName, namespace) as Promise<Pipeline>
  );

  const draft = createBuildPipelineRunDraft({
    codebase,
    codebaseBranch,
    // The schema models only `spec.pipelineRef.name` on a resourcetemplate; the
    // runtime payload is a full PipelineRun, which the cast reflects. The
    // builder clones it before mutating.
    pipelineRunTemplate: resourceTemplate as unknown as PipelineRun,
    gitServer,
    pipeline,
    triggerTemplate,
  });

  return { draft, codebaseBranch };
}
