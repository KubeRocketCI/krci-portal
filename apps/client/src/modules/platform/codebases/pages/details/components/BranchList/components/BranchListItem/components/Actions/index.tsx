import { CodebaseBranchActionsMenu } from "@/modules/platform/codebases/components/CodebaseBranchActionsMenu";
import {
  useCodebaseBranchListWatch,
  useCodebaseWatch,
  usePipelineNamesWatch,
} from "@/modules/platform/codebases/pages/details/hooks/data";
import { Button } from "@/core/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { checkIsDefaultBranch } from "@my-project/shared";
import { EllipsisVertical } from "lucide-react";
import React from "react";
import { ActionsProps } from "./types";

export const Actions = ({ codebaseBranch }: ActionsProps) => {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const codebaseBranchListWatch = useCodebaseBranchListWatch();

  const pipelineNamesWatch = usePipelineNamesWatch();
  const pipelineNames = pipelineNamesWatch.data;

  const sortedCodebaseBranchList = React.useMemo(() => {
    return codebaseBranchListWatch.data.array.sort((a) =>
      checkIsDefaultBranch(codebaseWatch.query.data!, a) ? -1 : 1
    );
  }, [codebaseWatch.query.data, codebaseBranchListWatch.data.array]);

  const defaultBranch = sortedCodebaseBranchList[0];

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
            codebaseBranches: codebaseBranchListWatch.data.array,
            defaultBranch,
            pipelines: {
              review: pipelineNames?.reviewPipelineName || "",
              build: pipelineNames?.buildPipelineName || "",
              security: pipelineNames?.securityPipelineName || "",
            },
          }}
        />
      )}
    </DropdownMenu>
  );
};
