import { Dialog, DialogContent, DialogTitle, Grid, IconButton, Typography } from "@mui/material";
import React from "react";
import { PIPELINE_GRAPH_DIALOG_NAME } from "./constants";
import { PipelineGraphDialogProps } from "./types";
import { X } from "lucide-react";
import { usePipelineWatchItem } from "@/k8s/api/groups/Tekton/Pipeline";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";

export const PipelineGraphDialog: React.FC<PipelineGraphDialogProps> = ({
  props: { pipelineName, namespace },
  state: { closeDialog, open },
}) => {
  const pipelineWatch = usePipelineWatchItem({
    name: pipelineName,
    namespace,
  });

  const pipeline = pipelineWatch.query.data;

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
      <DialogContent>
        <LoadingWrapper isLoading={pipelineWatch.query.isLoading}>
          <>test</>
          {/* <PipelineGraph pipeline={pipeline} /> */}
        </LoadingWrapper>
      </DialogContent>
    </Dialog>
  );
};

PipelineGraphDialog.displayName = PIPELINE_GRAPH_DIALOG_NAME;
