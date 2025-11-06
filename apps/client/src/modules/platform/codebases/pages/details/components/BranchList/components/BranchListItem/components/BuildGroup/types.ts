import { CodebaseBranch, PipelineRun } from "@my-project/shared";

export interface BuildGroupProps {
  codebaseBranch: CodebaseBranch;
  latestBuildPipelineRun: PipelineRun | undefined;
}
