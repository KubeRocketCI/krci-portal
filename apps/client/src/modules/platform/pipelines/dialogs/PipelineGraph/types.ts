import { DialogProps } from "@/core/providers/Dialog/types";
import { Pipeline } from "@my-project/shared";

export type PipelineGraphDialogProps = DialogProps<{
  pipeline: Pipeline;
}>;
