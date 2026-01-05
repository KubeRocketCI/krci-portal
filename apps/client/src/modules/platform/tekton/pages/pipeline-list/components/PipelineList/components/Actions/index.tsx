import { PipelineActionsMenu } from "@/modules/platform/tekton/components/PipelineActionsMenu";
import { Button } from "@/core/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { Pipeline } from "@my-project/shared";
import { EllipsisVertical } from "lucide-react";
import React from "react";

export const Actions = ({ pipeline }: { pipeline: Pipeline }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={"Options"}>
          <EllipsisVertical size={20} />
        </Button>
      </DropdownMenuTrigger>
      <PipelineActionsMenu
        variant="menu"
        data={{
          pipeline,
        }}
      />
    </DropdownMenu>
  );
};
