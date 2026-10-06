import { createLazyDialog } from "@/core/providers/Dialog/createLazyDialog";
import { PIPELINE_GRAPH_DIALOG_NAME } from "./constants";

export const PipelineGraphDialog = createLazyDialog(
  PIPELINE_GRAPH_DIALOG_NAME,
  () => import("./PipelineGraphDialog"),
  "PipelineGraphDialog"
);
