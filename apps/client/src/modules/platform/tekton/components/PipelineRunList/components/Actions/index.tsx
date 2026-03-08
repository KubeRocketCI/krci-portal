import { Button } from "@/core/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import React from "react";
import { PipelineRun, tektonResultAnnotations } from "@my-project/shared";
import { PipelineRunActionsMenu } from "../../../PipelineRunActionsMenu";
import { EllipsisVertical } from "lucide-react";

export const Actions = ({ pipelineRun }: { pipelineRun: PipelineRun }) => {
  const [open, setOpen] = React.useState(false);

  // History items (from Tekton Results) don't support K8s operations like stop/delete
  const isHistoryItem = pipelineRun.metadata.annotations?.[tektonResultAnnotations.historySource] === "true";

  if (isHistoryItem) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={"Options"}>
          <EllipsisVertical size={20} />
        </Button>
      </DropdownMenuTrigger>
      <PipelineRunActionsMenu
        variant="menu"
        data={{
          pipelineRun,
        }}
      />
    </DropdownMenu>
  );
};
