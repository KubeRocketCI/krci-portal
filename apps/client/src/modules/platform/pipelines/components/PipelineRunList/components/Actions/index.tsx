import { IconButton } from "@mui/material";
import React from "react";
import { PipelineRun } from "@my-project/shared";
import { PipelineRunActionsMenu } from "../../../PipelineRunActionsMenu";
import { EllipsisVertical } from "lucide-react";

export const Actions = ({ resource }: { resource: PipelineRun }) => {
  const buttonRef = React.createRef<HTMLButtonElement>();
  const [anchor, setAnchor] = React.useState<(EventTarget & HTMLButtonElement) | null>(null);

  return (
    <>
      <IconButton ref={buttonRef} aria-label={"Options"} onClick={(e) => setAnchor(e.currentTarget)} size="large">
        <EllipsisVertical size={20} />
      </IconButton>
      <PipelineRunActionsMenu
        variant="menu"
        data={{
          pipelineRun: resource?.jsonData || resource,
        }}
        anchorEl={anchor}
        handleCloseResourceActionListMenu={() => setAnchor(null)}
      />
    </>
  );
};
