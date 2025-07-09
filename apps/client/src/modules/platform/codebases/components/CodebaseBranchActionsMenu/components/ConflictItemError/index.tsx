import { Typography } from "@mui/material";
import { useStyles } from "./styles";
import { Link } from "@tanstack/react-router";
import { ConflictItemErrorProps } from "./types";
import { routeCDPipelineDetails } from "@/modules/platform/cdpipelines/pages/details/route";
import { useClusterStore } from "@/core/store";
import { useShallow } from "zustand/react/shallow";

export const ConflictItemError = ({ conflictedCDPipeline, name }: ConflictItemErrorProps) => {
  const classes = useStyles();

  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  return (
    <div className={classes.message}>
      <Typography component={"span"}>Branch {name} is used in </Typography>
      <div className={classes.conflictEntityName}>
        <Link
          to={routeCDPipelineDetails.fullPath}
          params={{
            clusterName,
            name: conflictedCDPipeline.metadata.name!,
            namespace: conflictedCDPipeline.metadata.namespace!,
          }}
        >
          {conflictedCDPipeline.metadata.name}
        </Link>
      </div>
      <Typography component={"span"}> Deployment Flow</Typography>
    </div>
  );
};
