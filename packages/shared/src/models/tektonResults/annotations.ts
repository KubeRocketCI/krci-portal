export const tektonResultAnnotations = {
  gitBranch: "app.edp.epam.com/git-branch",
  gitTargetBranch: "app.edp.epam.com/git-target-branch",
  gitChangeNumber: "app.edp.epam.com/git-change-number",
  gitChangeUrl: "app.edp.epam.com/git-change-url",
  gitCommitSha: "app.edp.epam.com/git-commit-sha",
  gitRepository: "app.edp.epam.com/git-repository",
  gitAuthor: "app.edp.epam.com/git-author",
  gitAvatar: "app.edp.epam.com/git-avatar",
  codebase: "app.edp.epam.com/codebase",
  codebaseBranch: "app.edp.epam.com/codebasebranch",
  pipelineType: "app.edp.epam.com/pipelinetype",
  stage: "app.edp.epam.com/stage",
  pipeline: "tekton.dev/pipeline",
  objectMetadataName: "object.metadata.name",
  /** Client-side marker indicating the PipelineRun was loaded from Tekton Results history */
  historySource: "app.edp.epam.com/history-source",
  /** Annotation added by Tekton Results Watcher on archived PipelineRuns/TaskRuns */
  tektonResultRef: "results.tekton.dev/result",
  /** Record reference annotation added by Tekton Results Watcher */
  tektonRecordRef: "results.tekton.dev/record",
  /** Log reference annotation added by Tekton Results Watcher */
  tektonLogRef: "results.tekton.dev/log",
} as const;
