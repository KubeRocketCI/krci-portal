import { CodebaseBranch, PipelineRun } from "@my-project/shared";

export interface TektonBuildGroupProps {
  codebaseBranch: CodebaseBranch;
  latestBuildPipelineRun: PipelineRun | undefined;
  menuAnchorEl: HTMLElement | null;
  handleClickMenu: (event: React.MouseEvent<HTMLElement>) => void;
  handleCloseMenu: () => void;
}
