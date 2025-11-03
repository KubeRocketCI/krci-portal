import { DialogProps } from "@/core/providers/Dialog/types";

export interface PipelineRunGraphDialogProps {
  pipelineRunName: string;
  namespace: string;
}

export type PipelineRunGraphDialogPropsWithBaseDialogProps = DialogProps<PipelineRunGraphDialogProps>;
