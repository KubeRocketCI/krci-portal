import { CodebaseBranchActionsMenu } from "@/modules/platform/codebases/components/CodebaseBranchActionsMenu";
import {
  useCodebaseBranchListWatch,
  useCodebaseWatch,
  usePipelineNamesWatch,
} from "@/modules/platform/codebases/pages/details/hooks/data";
import { IconButton } from "@mui/material";
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
    return codebaseBranchListWatch.dataArray.sort((a) => (checkIsDefaultBranch(codebaseWatch.query.data!, a) ? -1 : 1));
  }, [codebaseWatch.query.data, codebaseBranchListWatch.dataArray]);

  const defaultBranch = sortedCodebaseBranchList[0];

  const buttonRef = React.createRef<HTMLButtonElement>();
  const [anchor, setAnchor] = React.useState<(EventTarget & HTMLButtonElement) | null>(null);

  const resourcesAreLoaded =
    codebaseWatch.query.isFetched &&
    codebaseWatch.query.data &&
    codebaseBranchListWatch.query.isFetched &&
    pipelineNamesWatch.isFetched;

  return (
    <>
      <IconButton ref={buttonRef} aria-label={"Options"} onClick={(e) => setAnchor(e.currentTarget)} size="large">
        <EllipsisVertical size={20} color={"grey"} />
      </IconButton>
      {resourcesAreLoaded && (
        <CodebaseBranchActionsMenu
          variant="menu"
          data={{
            codebaseBranch,
            codebase: codebase!,
            codebaseBranches: codebaseBranchListWatch.dataArray,
            defaultBranch,
            pipelines: {
              review: pipelineNames?.reviewPipelineName || "",
              build: pipelineNames?.buildPipelineName || "",
            },
          }}
          anchorEl={anchor}
          handleCloseResourceActionListMenu={() => setAnchor(null)}
        />
      )}
    </>
  );
};
