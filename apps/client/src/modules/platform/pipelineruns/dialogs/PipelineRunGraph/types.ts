import { BaseDialogProps } from "@/core/providers/Dialog/types";

export interface PipelineRunGraphDialogProps {
  pipelineRunName: string;
  namespace: string;
}

export type PipelineRunGraphDialogPropsWithBaseDialogProps = BaseDialogProps<PipelineRunGraphDialogProps>;
