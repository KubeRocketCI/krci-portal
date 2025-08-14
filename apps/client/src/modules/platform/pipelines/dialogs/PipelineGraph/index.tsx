import { Dialog, DialogContent, DialogTitle, Grid, IconButton, Typography } from "@mui/material";
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
        <Grid container spacing={2} alignItems={"center"} justifyContent={"space-between"}>
          <Grid item>
            <Typography variant={"h4"}>{`Pipeline: ${pipelineName}`}</Typography>
          </Grid>
          <Grid item>
            <IconButton onClick={() => closeDialog()} size="large">
              <X size={20} />
            </IconButton>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent sx={{ height: "100%", p: 0 }}>
        <PipelineDiagram pipelineName={pipelineName} namespace={namespace!} />
      </DialogContent>
    </Dialog>
  );
};

PipelineGraphDialog.displayName = PIPELINE_GRAPH_DIALOG_NAME;
