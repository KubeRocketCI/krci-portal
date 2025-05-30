import { CodebaseBranch, PipelineRun, PipelineRunDraft } from "@my-project/shared";

export interface BuildGroupProps {
  codebaseBranch: CodebaseBranch;
  latestBuildPipelineRun: PipelineRun;
  handleOpenEditor: (data: PipelineRunDraft) => void;
  menuAnchorEl: HTMLElement | null;
  handleClickMenu: (event: React.MouseEvent<HTMLElement>) => void;
  handleCloseMenu: () => void;
}
