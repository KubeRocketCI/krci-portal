import { createLazyDialog } from "@/core/providers/Dialog/createLazyDialog";
import { GITLABCI_PIPELINE_LOGS_DIALOG_NAME } from "./constants";

export const GitLabCIPipelineLogsDialog = createLazyDialog(
  GITLABCI_PIPELINE_LOGS_DIALOG_NAME,
  () => import("./GitLabCIPipelineLogsDialog"),
  "GitLabCIPipelineLogsDialog"
);
