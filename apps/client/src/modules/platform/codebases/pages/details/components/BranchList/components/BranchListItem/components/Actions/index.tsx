import { CodebaseBranchActionsMenu } from "@/modules/platform/codebases/components/CodebaseBranchActionsMenu";
import { useDataContext } from "@/modules/platform/codebases/pages/details/providers/Data/hooks";
import { IconButton } from "@mui/material";
import { EllipsisVertical } from "lucide-react";
import React from "react";
import { ActionsProps } from "./types";

export const Actions = ({ codebaseBranch }: ActionsProps) => {
  const buttonRef = React.createRef<HTMLButtonElement>();
  const [anchor, setAnchor] = React.useState<(EventTarget & HTMLButtonElement) | null>(null);

  const {
    codebaseWatch,
    codebaseBranches,
    defaultBranch,
    codebaseBranchListWatch,
    reviewPipelineName,
    buildPipelineName,
  } = useDataContext();

  const resourcesAreLoaded = codebaseWatch.isFetched && codebaseWatch.data && codebaseBranchListWatch.query.isFetched;

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
            codebase: codebaseWatch.data!,
            codebaseBranches,
            defaultBranch,
            pipelines: {
              review: reviewPipelineName,
              build: buildPipelineName,
            },
          }}
          anchorEl={anchor}
          handleCloseResourceActionListMenu={() => setAnchor(null)}
        />
      )}
    </>
  );
};
