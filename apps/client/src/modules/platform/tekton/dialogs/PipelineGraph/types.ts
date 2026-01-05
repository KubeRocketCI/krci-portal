import { DialogProps } from "@/core/providers/Dialog/types";

export type PipelineGraphDialogProps = DialogProps<{
  pipelineName: string;
  namespace?: string;
}>;
