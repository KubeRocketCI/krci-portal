import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { Button } from "@mui/material";
import { createCodebaseBranchDraftObject } from "@my-project/shared";
import { Pencil } from "lucide-react";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { DialogHeaderProps } from "./types";

export const DialogHeader = ({ setEditorOpen, setEditorData }: DialogHeaderProps) => {
  const {
    props: { codebase },
  } = useCurrentDialog();

  const { getValues } = useTypedFormContext();

  const handleOpenEditor = React.useCallback(() => {
    setEditorOpen(true);
    const formValues = getValues();

    const newCodebaseBranch = createCodebaseBranchDraftObject({
      branchName: formValues.branchName,
      fromCommit: formValues.fromCommit,
      release: formValues.release,
      codebase: codebase.metadata.name,
      pipelines: {
        build: formValues.buildPipeline,
        review: formValues.reviewPipeline,
      },
      version: formValues.version,
    });

    setEditorData(newCodebaseBranch);
  }, [codebase.metadata.name, getValues, setEditorData, setEditorOpen]);

  return (
    <div className="flex flex-row items-start justify-between gap-2">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">
          {`Create branch for "${codebase?.metadata.name}"`}{" "}
        </h2>
        <LearnMoreLink url={EDP_USER_GUIDE.BRANCHES_MANAGE.anchors.ADD_BRANCH.url} />
      </div>
      <Button
        startIcon={<Pencil size={16} />}
        size="small"
        component={"button"}
        onClick={handleOpenEditor}
        style={{ flexShrink: 0 }}
        color="inherit"
      >
        Edit YAML
      </Button>
    </div>
  );
};
