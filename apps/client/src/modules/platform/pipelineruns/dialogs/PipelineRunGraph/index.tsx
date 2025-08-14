import { Dialog, DialogContent, DialogTitle, Grid, IconButton, Typography } from "@mui/material";
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
        <Grid container spacing={2} alignItems={"center"} justifyContent={"space-between"}>
          <Grid item>
            <Typography variant={"h4"}>{pipelineRunName ? `Pipeline Run: ${pipelineRunName}` : "Not found"}</Typography>
          </Grid>
          <Grid item>
            <IconButton onClick={() => closeDialog()} size="large">
              <X size={20} />
            </IconButton>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent sx={{ height: "100%", p: 0 }}>
        <PipelineRunDiagram pipelineRunName={pipelineRunName} namespace={namespace} />
      </DialogContent>
    </Dialog>
  );
};

PipelineRunGraphDialog.displayName = PIPELINE_RUN_GRAPH_DIALOG_NAME;
