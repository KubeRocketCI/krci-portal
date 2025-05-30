import { Dialog, DialogContent, DialogTitle, Grid, IconButton, Typography } from "@mui/material";
import React from "react";
import { PIPELINE_GRAPH_DIALOG_NAME } from "./constants";
import { PipelineGraphDialogProps } from "./types";
import { X } from "lucide-react";

export const PipelineGraphDialog: React.FC<PipelineGraphDialogProps> = ({
  props: { pipeline },
  state: { closeDialog, open },
}) => {
  return (
    <Dialog open={open} fullWidth onClose={() => closeDialog()} maxWidth={pipeline ? "xl" : "sm"}>
      <DialogTitle>
        <Grid container spacing={2} alignItems={"center"} justifyContent={"space-between"}>
          <Grid item>
            <Typography variant={"h4"}>{pipeline ? `Pipeline: ${pipeline?.metadata.name}` : "Not found"}</Typography>
          </Grid>
          <Grid item>
            <IconButton onClick={() => closeDialog()} size="large">
              <X size={20} />
            </IconButton>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent>{/* <PipelineGraph pipeline={pipeline} /> */}</DialogContent>
    </Dialog>
  );
};

PipelineGraphDialog.displayName = PIPELINE_GRAPH_DIALOG_NAME;
