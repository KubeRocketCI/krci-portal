import { ActionsInlineList } from "@/core/components/ActionsInlineList";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import React from "react";
import { CustomActionsInlineListProps } from "./types";

export const CustomActionsInlineList = ({ groupActions, inlineActions }: CustomActionsInlineListProps) => {
  const [open, setOpen] = React.useState(false);
  const pipelineRunPermissions = usePipelineRunPermissions();

  const groupActionsWithoutFirstItem = groupActions.slice(1);

  return (
    <>
      <div className="flex flex-row items-center gap-2">
        <div className="flex">
          <ButtonWithPermission
            ButtonProps={{
              size: "sm",
              variant: "outline",
              onClick: groupActions[0].action,
              className:
                "rounded-r-none border-r-0 text-secondary-dark border-secondary-dark hover:bg-secondary-dark/10",
            }}
            allowed={pipelineRunPermissions.data.create.allowed}
            reason={pipelineRunPermissions.data.create.reason}
          >
            {groupActions[0].Icon}
            {groupActions[0].label}
          </ButtonWithPermission>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <ButtonWithPermission
                ButtonProps={{
                  size: "sm",
                  variant: "outline",
                  className: "rounded-l-none text-secondary-dark border-secondary-dark hover:bg-secondary-dark/10",
                }}
                allowed={pipelineRunPermissions.data.create.allowed}
                reason={pipelineRunPermissions.data.create.reason}
              >
                <ChevronDown size={16} />
              </ButtonWithPermission>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[1]">
              {groupActionsWithoutFirstItem.map((option) => (
                <DropdownMenuItem key={option.label} onClick={option.action} className="flex items-center gap-2">
                  {option.Icon}
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ActionsInlineList actions={inlineActions} />
      </div>
    </>
  );
};
