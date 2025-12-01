import { DialogProps } from "@/core/providers/Dialog/types";
import { CDPipeline } from "@my-project/shared";

export type EditCDPipelineDialogProps = DialogProps<{
  CDPipeline: CDPipeline;
}>;

