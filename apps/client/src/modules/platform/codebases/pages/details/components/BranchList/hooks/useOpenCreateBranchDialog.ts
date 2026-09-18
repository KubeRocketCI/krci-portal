import React from "react";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { CreateCodebaseBranchDialog } from "@/modules/platform/codebases/components/CreateCodebaseBranchDialog";
import { useCodebaseBranchListWatch, useCodebaseWatch, usePipelineNamesWatch } from "../../../hooks/data";

/** Returns a no-op until the codebase is loaded. */
export function useOpenCreateBranchDialog(): () => void {
  const codebase = useCodebaseWatch().query.data;
  const branches = useCodebaseBranchListWatch().data.array;
  const pipelineNames = usePipelineNamesWatch().data;
  const { setDialog } = useDialogContext();

  return React.useCallback(() => {
    if (!codebase) {
      return;
    }

    const defaultBranch =
      branches.find((branch) => branch.spec.branchName === codebase.spec.defaultBranch) ?? branches[0];

    setDialog(CreateCodebaseBranchDialog, {
      codebaseBranches: branches,
      codebase,
      defaultBranch,
      pipelines: {
        review: pipelineNames?.reviewPipelineName || "",
        build: pipelineNames?.buildPipelineName || "",
        security: pipelineNames?.securityPipelineName || "",
      },
    });
  }, [branches, codebase, pipelineNames, setDialog]);
}
