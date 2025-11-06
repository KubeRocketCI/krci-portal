import { CDPipelineActionsMenu } from "@/modules/platform/cdpipelines/components/CDPipelineActionsMenu";
import { Button } from "@/core/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { CDPipeline } from "@my-project/shared";
import { EllipsisVertical } from "lucide-react";
import React from "react";

export const Actions = ({ resource }: { resource: CDPipeline }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={"Options"}
        >
          <EllipsisVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <CDPipelineActionsMenu
        variant="menu"
        data={{
          CDPipeline: resource,
        }}
      />
    </DropdownMenu>
  );
};
