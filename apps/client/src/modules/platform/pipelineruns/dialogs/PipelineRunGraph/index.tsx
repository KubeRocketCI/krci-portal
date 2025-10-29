import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { X } from "lucide-react";
import React from "react";
import { PipelineRunDiagram } from "../../components/PipelineRunDiagram";
import { PIPELINE_RUN_GRAPH_DIALOG_NAME } from "./constants";
import { PipelineRunGraphDialogPropsWithBaseDialogProps } from "./types";

export const PipelineRunGraphDialog: React.FC<PipelineRunGraphDialogPropsWithBaseDialogProps> = ({
  props: { pipelineRunName, namespace },
  state: { closeDialog, open },
}) => {
  return (
    <Dialog open={open} fullScreen onClose={() => closeDialog()}>
      <DialogTitle>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">{pipelineRunName ? `Pipeline Run: ${pipelineRunName}` : "Not found"}</h1>
          </div>
          <div>
            <IconButton onClick={() => closeDialog()} size="large">
              <X size={20} />
            </IconButton>
          </div>
        </div>
      </DialogTitle>
      <DialogContent sx={{ height: "100%", p: 0 }}>
        <PipelineRunDiagram pipelineRunName={pipelineRunName} namespace={namespace} />
      </DialogContent>
    </Dialog>
  );
};

PipelineRunGraphDialog.displayName = PIPELINE_RUN_GRAPH_DIALOG_NAME;
