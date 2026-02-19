import { CodebaseBranch, PipelineRun } from "@my-project/shared";

export interface EnrichedBranch {
  codebaseBranch: CodebaseBranch;
  latestBuildPipelineRun?: PipelineRun;
  latestSecurityPipelineRun?: PipelineRun;
}
