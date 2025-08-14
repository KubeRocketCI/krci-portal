import { TaskActionsMenu } from "@/modules/platform/tasks/components/TaskActionsMenu";
import { IconButton } from "@mui/material";
import { Task } from "@my-project/shared";
import { EllipsisVertical } from "lucide-react";
import React from "react";

export const Actions = ({ task }: { task: Task }) => {
  const buttonRef = React.createRef<HTMLButtonElement>();
  const [anchor, setAnchor] = React.useState<(EventTarget & HTMLButtonElement) | null>(null);

  return (
    <>
      <IconButton ref={buttonRef} aria-label={"Options"} onClick={(e) => setAnchor(e.currentTarget)} size="large">
        <EllipsisVertical size={20} />
      </IconButton>
      <TaskActionsMenu
        variant="menu"
        data={{
          task,
        }}
        anchorEl={anchor}
        handleCloseResourceActionListMenu={() => setAnchor(null)}
      />
    </>
  );
};
