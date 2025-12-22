import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import React from "react";
import { PipelineRunDiagram } from "../../components/PipelineRunDiagram";
import { PIPELINE_RUN_GRAPH_DIALOG_NAME } from "./constants";
import { PipelineRunGraphDialogPropsWithBaseDialogProps } from "./types";

export const PipelineRunGraphDialog: React.FC<PipelineRunGraphDialogPropsWithBaseDialogProps> = ({
  props: { pipelineRunName, namespace },
  state: { closeDialog, open },
}) => {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="h-full w-full max-w-full p-0">
        <DialogHeader>
          <DialogTitle className="text-4xl font-bold">
            {pipelineRunName ? `Pipeline Run: ${pipelineRunName}` : "Not found"}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1">
          <PipelineRunDiagram pipelineRunName={pipelineRunName} namespace={namespace} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

PipelineRunGraphDialog.displayName = PIPELINE_RUN_GRAPH_DIALOG_NAME;
