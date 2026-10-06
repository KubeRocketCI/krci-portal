import { createLazyDialog } from "@/core/providers/Dialog/createLazyDialog";
import { PIPELINE_RUN_GRAPH_DIALOG_NAME } from "./constants";

export const PipelineRunGraphDialog = createLazyDialog(
  PIPELINE_RUN_GRAPH_DIALOG_NAME,
  () => import("./PipelineRunGraphDialog"),
  "PipelineRunGraphDialog"
);
