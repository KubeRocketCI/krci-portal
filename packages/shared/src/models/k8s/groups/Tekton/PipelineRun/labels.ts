export const pipelineRunLabels = {
  parentPipelineRun: "app.edp.epam.com/parentPipelineRun",
  codebaseBranch: "app.edp.epam.com/codebasebranch",
  codebase: "app.edp.epam.com/codebase",
  pipelineType: "app.edp.epam.com/pipelinetype",
  pipeline: "tekton.dev/pipeline",
  cdPipeline: "app.edp.epam.com/cdpipeline",
  stage: "app.edp.epam.com/stage",
  cdStage: "app.edp.epam.com/cdstage",
  changeNumber: "app.edp.epam.com/changenumber",
  gitAuthor: "app.edp.epam.com/gitauthor",
} as const;
