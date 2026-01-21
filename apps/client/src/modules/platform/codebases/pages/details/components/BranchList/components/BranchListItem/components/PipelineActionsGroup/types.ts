import { CodebaseBranch, PipelineRun } from "@my-project/shared";

export interface PipelineActionsGroupProps {
  codebaseBranch: CodebaseBranch;
  latestBuildPipelineRun?: PipelineRun;
  latestSecurityPipelineRun?: PipelineRun;
}
