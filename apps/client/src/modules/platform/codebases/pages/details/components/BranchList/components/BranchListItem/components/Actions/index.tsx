import { CodebaseBranchActionsMenu } from "@/modules/platform/codebases/components/CodebaseBranchActionsMenu";
import { useCodebaseWatch } from "@/modules/platform/codebases/pages/details/hooks/data";
import { Button } from "@/core/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { EllipsisVertical } from "lucide-react";
import React from "react";
import { ActionsProps } from "./types";

export const Actions = ({ codebaseBranch }: ActionsProps) => {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={"Options"}>
          <EllipsisVertical size={20} color={"grey"} />
        </Button>
      </DropdownMenuTrigger>
      {codebase && (
        <CodebaseBranchActionsMenu
          variant="menu"
          data={{
            codebaseBranch,
            codebase,
          }}
        />
      )}
    </DropdownMenu>
  );
};
