import { CDPipelineActionsMenu } from "@/modules/platform/cdpipelines/components/CDPipelineActionsMenu";
import { IconButton } from "@mui/material";
import { CDPipeline } from "@my-project/shared";
import { EllipsisVertical } from "lucide-react";
import React from "react";

export const Actions = ({ resource }: { resource: CDPipeline }) => {
  const buttonRef = React.createRef<HTMLButtonElement>();
  const [anchor, setAnchor] = React.useState<(EventTarget & HTMLButtonElement) | null>(null);

  return (
    <>
      <IconButton ref={buttonRef} aria-label={"Options"} onClick={(e) => setAnchor(e.currentTarget)} size="large">
        <EllipsisVertical size={16} />
      </IconButton>
      {anchor ? (
        <CDPipelineActionsMenu
          variant="menu"
          data={{
            CDPipeline: resource,
          }}
          anchorEl={anchor}
          handleCloseResourceActionListMenu={() => setAnchor(null)}
        />
      ) : null}
    </>
  );
};
