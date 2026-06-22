import { DialogProps } from "@/core/providers/Dialog/types";

export interface GitLabCIPipelineLogsDialogProps {
  gitServer: string;
  /** Project path, e.g. "krci/my-app". */
  project: string;
  pipelineId: string;
  pipelineStatus: string;
  codebaseName: string;
  ref: string;
  webUrl: string;
}

export type GitLabCIPipelineLogsDialogPropsWithBase = DialogProps<GitLabCIPipelineLogsDialogProps>;
