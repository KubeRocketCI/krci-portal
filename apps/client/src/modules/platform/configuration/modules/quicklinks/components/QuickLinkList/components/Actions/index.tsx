import { QuickLink } from "@my-project/shared";
import { QuickLinkActionsMenu } from "../../../QuickLinkActionsMenu";
import React from "react";
import { EllipsisVertical } from "lucide-react";
import { IconButton } from "@mui/material";

export const Actions = ({ quickLink }: { quickLink: QuickLink }) => {
  const buttonRef = React.createRef<HTMLButtonElement>();
  const [anchor, setAnchor] = React.useState<(EventTarget & HTMLButtonElement) | null>(null);

  return (
    <>
      <IconButton ref={buttonRef} aria-label={"Options"} onClick={(e) => setAnchor(e.currentTarget)} size="large">
        <EllipsisVertical />
      </IconButton>
      {anchor ? (
        <QuickLinkActionsMenu
          variant="menu"
          data={{
            quickLink,
          }}
          anchorEl={anchor}
          handleCloseResourceActionListMenu={() => setAnchor(null)}
        />
      ) : null}
    </>
  );
};
