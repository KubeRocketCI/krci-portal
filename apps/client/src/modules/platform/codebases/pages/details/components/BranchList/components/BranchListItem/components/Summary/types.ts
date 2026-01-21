import { CodebaseBranch, PipelineRun } from "@my-project/shared";

export interface SummaryProps {
  codebaseBranch: CodebaseBranch;
  latestBuildPipelineRun: PipelineRun | undefined;
  latestSecurityPipelineRun: PipelineRun | undefined;
}
