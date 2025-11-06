import { TaskActionsMenu } from "@/modules/platform/tasks/components/TaskActionsMenu";
import { Button } from "@/core/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { Task } from "@my-project/shared";
import { EllipsisVertical } from "lucide-react";
import React from "react";

export const Actions = ({ task }: { task: Task }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={"Options"}
        >
          <EllipsisVertical size={20} />
        </Button>
      </DropdownMenuTrigger>
      <TaskActionsMenu
        variant="menu"
        data={{
          task,
        }}
      />
    </DropdownMenu>
  );
};
