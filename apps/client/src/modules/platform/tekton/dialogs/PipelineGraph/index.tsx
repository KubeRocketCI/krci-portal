import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import React from "react";
import { PipelineDiagram } from "../../components/PipelineDiagram";
import { PIPELINE_GRAPH_DIALOG_NAME } from "./constants";
import { PipelineGraphDialogProps } from "./types";

export const PipelineGraphDialog: React.FC<PipelineGraphDialogProps> = ({
  props: { pipelineName, namespace },
  state: { closeDialog, open },
}) => {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="flex h-full w-full max-w-full flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl font-medium">{`Pipeline: ${pipelineName}`}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1">
          <PipelineDiagram pipelineName={pipelineName} namespace={namespace!} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

PipelineGraphDialog.displayName = PIPELINE_GRAPH_DIALOG_NAME;
