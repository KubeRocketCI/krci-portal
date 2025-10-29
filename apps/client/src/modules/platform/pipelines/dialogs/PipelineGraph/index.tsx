import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { X } from "lucide-react";
import React from "react";
import { PipelineDiagram } from "../../components/PipelineDiagram";
import { PIPELINE_GRAPH_DIALOG_NAME } from "./constants";
import { PipelineGraphDialogProps } from "./types";

export const PipelineGraphDialog: React.FC<PipelineGraphDialogProps> = ({
  props: { pipelineName, namespace },
  state: { closeDialog, open },
}) => {
  return (
    <Dialog open={open} fullScreen onClose={() => closeDialog()}>
      <DialogTitle>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">{`Pipeline: ${pipelineName}`}</h1>
          </div>
          <div>
            <IconButton onClick={() => closeDialog()} size="large">
              <X size={20} />
            </IconButton>
          </div>
        </div>
      </DialogTitle>
      <DialogContent sx={{ height: "100%", p: 0 }}>
        <PipelineDiagram pipelineName={pipelineName} namespace={namespace!} />
      </DialogContent>
    </Dialog>
  );
};

PipelineGraphDialog.displayName = PIPELINE_GRAPH_DIALOG_NAME;
