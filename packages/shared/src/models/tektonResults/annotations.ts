/**
 * TektonResult Annotations
 *
 * These are annotation keys found in TektonResult API responses.
 * The Result API populates annotations from both PipelineRun labels AND annotations,
 * but they all appear in the `annotations` field of the Result object.
 *
 * Note: Some keys overlap with pipelineRunLabels (codebase, codebaseBranch, etc.)
 * but are kept here for clarity when working with TektonResult data.
 */

/**
 * Annotations specific to TektonResult API responses
 * These may come from PipelineRun labels, annotations, or be Result-specific
 */
export const tektonResultAnnotations = {
  // Git-related annotations (from PipelineRun annotations)
  gitBranch: "app.edp.epam.com/git-branch",
  gitTargetBranch: "app.edp.epam.com/git-target-branch",
  gitChangeNumber: "app.edp.epam.com/git-change-number",
  gitChangeUrl: "app.edp.epam.com/git-change-url",
  gitCommitSha: "app.edp.epam.com/git-commit-sha",
  gitRepository: "app.edp.epam.com/git-repository",
  gitAuthor: "app.edp.epam.com/git-author",
  gitAvatar: "app.edp.epam.com/git-avatar",

  // EDP annotations (from PipelineRun labels/annotations)
  codebase: "app.edp.epam.com/codebase",
  codebaseBranch: "app.edp.epam.com/codebasebranch",
  pipelineType: "app.edp.epam.com/pipelinetype",

  // Tekton annotations
  pipeline: "tekton.dev/pipeline",

  // Result-specific annotations
  objectMetadataName: "object.metadata.name",
} as const;
