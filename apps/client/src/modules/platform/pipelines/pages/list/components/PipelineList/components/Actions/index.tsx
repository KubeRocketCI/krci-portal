import { PipelineActionsMenu } from "@/modules/platform/pipelines/components/PipelineActionsMenu";
import { IconButton } from "@mui/material";
import { Pipeline } from "@my-project/shared";
import { EllipsisVertical } from "lucide-react";
import React from "react";

export const Actions = ({ pipeline }: { pipeline: Pipeline }) => {
  const buttonRef = React.createRef<HTMLButtonElement>();
  const [anchor, setAnchor] = React.useState<(EventTarget & HTMLButtonElement) | null>(null);

  return (
    <>
      <IconButton ref={buttonRef} aria-label={"Options"} onClick={(e) => setAnchor(e.currentTarget)} size="large">
        <EllipsisVertical size={20} />
      </IconButton>
      <PipelineActionsMenu
        variant="menu"
        data={{
          pipeline,
        }}
        anchorEl={anchor}
        handleCloseResourceActionListMenu={() => setAnchor(null)}
      />
    </>
  );
};
