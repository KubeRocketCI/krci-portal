import type { DialogProps } from "@/core/providers/Dialog/types";
import type { PipelineRunViewMutationResult } from "../../hooks/usePipelineRunViews";
import type { PipelineRunView } from "../../types";

export type PipelineRunViewNameDialogProps = DialogProps<{
  mode: "create" | "rename";
  /** Views of the cluster, for the duplicate-name check. */
  views: PipelineRunView[];
  /** Rename only: the view being renamed. */
  view?: PipelineRunView;
  onSubmit: (name: string) => PipelineRunViewMutationResult;
}>;
