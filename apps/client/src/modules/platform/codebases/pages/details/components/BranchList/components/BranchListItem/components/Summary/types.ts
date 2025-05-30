import { CodebaseBranch, PipelineRun } from "@my-project/shared";

export interface SummaryProps {
  codebaseBranch: CodebaseBranch;
  latestBuildPipelineRun: PipelineRun | undefined;
  handleOpenEditor: (data: PipelineRun) => void;
  menuAnchorEl: HTMLElement | null;
  handleClickMenu: (event: React.MouseEvent<HTMLElement>) => void;
  handleCloseMenu: () => void;
}
