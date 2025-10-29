import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useCodebaseCRUD } from "@/k8s/api/groups/KRCI/Codebase";
import { SuccessDialog } from "@/modules/platform/codebases/dialogs/Success";
import { PATH_COMPONENT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { Button } from "@mui/material";
import { codebaseDeploymentScript, CodebaseDraft, codebaseLabels, createCodebaseDraftObject } from "@my-project/shared";
import React from "react";
import { useTypedFormContext } from "../../hooks/useFormContext";
import { useCurrentDialog } from "../../providers/CurrentDialog/hooks";
import { CreateCodebaseFromTemplateFormValues } from "../../types";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

export const FormActions = () => {
  const {
    state: { closeDialog },
  } = useCurrentDialog();

  const openSuccessDialog = useDialogOpener(SuccessDialog);

  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

  const {
    reset,
    formState: { isDirty },
    handleSubmit,
  } = useTypedFormContext();

  const onSuccess = React.useCallback(
    (codebaseData: CodebaseDraft) => {
      openSuccessDialog({
        dialogTitle: `Create Application`,
        title: `Your new Application is created`,
        description: `Browse your new Application and start working with it.`,
        route: {
          to: PATH_COMPONENT_DETAILS_FULL,
          params: {
            namespace: codebaseData.metadata.namespace || defaultNamespace,
            name: codebaseData.metadata.name,
          },
        },
      });

      closeDialog();
      reset();
    },
    [closeDialog, defaultNamespace, openSuccessDialog, reset]
  );

  const {
    triggerCreateCodebase,
    mutations: { codebaseCreateMutation },
  } = useCodebaseCRUD();

  const onSubmit = React.useCallback(
    async (values: CreateCodebaseFromTemplateFormValues) => {
      const codebaseDraft = createCodebaseDraftObject({
        name: values.name,
        gitServer: values.gitServer,
        gitUrlPath: values.gitUrlPath,
        type: values.type,
        buildTool: values.buildTool,
        defaultBranch: values.defaultBranch,
        deploymentScript: codebaseDeploymentScript["helm-chart"],
        emptyProject: values.emptyProject,
        framework: values.framework,
        lang: values.lang,
        private: values.private,
        repository: {
          url: values.repositoryUrl,
        },
        strategy: values.strategy,
        versioning: {
          type: values.versioningType,
          startFrom: values.versioningStartFrom,
        },
        ciTool: values.ciTool,
        labels: {
          [codebaseLabels.codebaseType]: values.type,
        },
      });

      await triggerCreateCodebase({
        data: {
          codebase: codebaseDraft,
          codebaseAuth: null,
        },
        callbacks: {
          onSuccess: () => {
            onSuccess(codebaseDraft);
          },
        },
      });
    },
    [triggerCreateCodebase, onSuccess]
  );

  const handleResetFields = React.useCallback(() => {
    reset();
  }, [reset]);

  return (
    <div className="flex justify-between w-full gap-2">
      <div className="flex gap-1">
        <div className="text-foreground">
          <Button onClick={closeDialog} size="small" color="inherit">
            cancel
          </Button>
        </div>
        <Button onClick={handleResetFields} size="small" disabled={!isDirty}>
          undo changes
        </Button>
      </div>
      <Button
        type={"submit"}
        onClick={handleSubmit(onSubmit)}
        variant={"contained"}
        color={"primary"}
        size="small"
        disabled={!isDirty || codebaseCreateMutation.isPending}
      >
        create
      </Button>
    </div>
  );
};
