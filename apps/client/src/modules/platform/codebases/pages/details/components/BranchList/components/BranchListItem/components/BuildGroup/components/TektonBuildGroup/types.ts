import { CodebaseBranch, PipelineRun } from "@my-project/shared";

export interface TektonBuildGroupProps {
  codebaseBranch: CodebaseBranch;
  latestBuildPipelineRun: PipelineRun | undefined;
}
