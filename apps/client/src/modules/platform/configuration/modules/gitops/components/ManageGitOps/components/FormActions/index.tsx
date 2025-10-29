import { Button, Tooltip } from "@mui/material";
import React from "react";
import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { ManageGitOpsDataContext, ManageGitOpsValues } from "../../types";
import { useFormContext } from "@/core/providers/Form/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { useCodebaseCRUD, useCodebasePermissions } from "@/k8s/api/groups/KRCI/Codebase";
import { codebaseLabels, createCodebaseDraftObject } from "@my-project/shared/models/k8s/groups/KRCI/Codebase";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";

export const FormActions = () => {
  const {
    reset,
    formState: { isDirty },
    handleSubmit,
  } = useReactHookFormContext<ManageGitOpsValues>();
  const {
    formData: { currentElement, handleClosePlaceholder, isReadOnly },
  } = useFormContext<ManageGitOpsDataContext>();

  const isPlaceholder = typeof currentElement === "string" && currentElement === "placeholder";
  const mode = isPlaceholder ? FORM_MODES.CREATE : FORM_MODES.EDIT;

  const handleClose = React.useCallback(() => {
    reset();

    if (handleClosePlaceholder) {
      handleClosePlaceholder();
    }
  }, [handleClosePlaceholder, reset]);

  const {
    triggerCreateCodebase,
    mutations: { codebaseCreateMutation, codebaseSecretCreateMutation, codebaseSecretDeleteMutation },
  } = useCodebaseCRUD();

  const codebasePermissions = useCodebasePermissions();

  const isLoading = React.useMemo(
    () =>
      codebaseCreateMutation.isPending ||
      codebaseSecretCreateMutation.isPending ||
      codebaseSecretDeleteMutation.isPending,
    [codebaseCreateMutation.isPending, codebaseSecretCreateMutation.isPending, codebaseSecretDeleteMutation.isPending]
  );

  const onSubmit = React.useCallback(
    async (values: ManageGitOpsValues) => {
      if (!codebasePermissions.data.create.allowed) {
        return false;
      }

      const newCodebaseDraft = createCodebaseDraftObject({
        name: values.name,
        gitServer: values.gitServer,
        gitUrlPath: values.gitUrlPath,
        type: values.type,
        buildTool: values.buildTool,
        defaultBranch: values.defaultBranch,
        deploymentScript: values.deploymentScript,
        emptyProject: values.emptyProject,
        framework: values.framework,
        lang: values.lang,
        private: false,
        repository: null,
        strategy: values.strategy,
        versioning: {
          type: values.versioningType,
          startFrom: values.versioningStartFrom,
        },
        ciTool: values.ciTool,
        labels: {
          [codebaseLabels.systemType]: "gitops",
          [codebaseLabels.codebaseType]: values.type,
        },
      });

      await triggerCreateCodebase({
        data: {
          codebase: newCodebaseDraft,
          codebaseAuth: null,
        },
        callbacks: {
          onSuccess: handleClose,
        },
      });
    },
    [codebasePermissions.data.create.allowed, triggerCreateCodebase, handleClose]
  );

  return (
    <>
      <div className="flex justify-between gap-4">
        <div>
          {mode === FORM_MODES.CREATE && (
            <Button onClick={handleClosePlaceholder} size="small" component={"button"}>
              cancel
            </Button>
          )}
        </div>
        <div>
          <div className="flex gap-4 items-center">
            <div>
              <Button onClick={() => reset()} size="small" component={"button"} disabled={!isDirty || isReadOnly}>
                undo changes
              </Button>
            </div>
            <div>
              <ConditionalWrapper
                condition={!codebasePermissions.data.create.allowed}
                wrapper={(children) => (
                  <Tooltip title={codebasePermissions.data.create.reason}>
                    <div>{children}</div>
                  </Tooltip>
                )}
              >
                <Button
                  type={"button"}
                  size={"small"}
                  component={"button"}
                  variant={"contained"}
                  color={"primary"}
                  disabled={isLoading || isReadOnly || !codebasePermissions.data.create.allowed}
                  onClick={handleSubmit(onSubmit)}
                >
                  save
                </Button>
              </ConditionalWrapper>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
