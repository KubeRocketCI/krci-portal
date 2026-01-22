import React from "react";
import { DialogBody, DialogFooter, DialogHeader } from "@/core/components/ui/dialog";
import { DialogHeader as CustomDialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { CodebaseBranchFormProvider } from "../../providers/form/provider";
import type { ManageCodebaseBranchFormValues } from "../../types";
import { useCodebaseBranchCRUD } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { editCodebaseBranchObject } from "@my-project/shared";
import { useCurrentDialog } from "../../providers/CurrentDialog/hooks";
import { showToast } from "@/core/components/Snackbar";

export const Edit = () => {
  const baseDefaultValues = useDefaultValues();
  const {
    props: { codebaseBranch, codebaseBranches },
    state: { closeDialog },
  } = useCurrentDialog();

  const { triggerEditCodebaseBranch } = useCodebaseBranchCRUD();

  const handleSubmit = React.useCallback(
    async (values: ManageCodebaseBranchFormValues) => {
      if (!codebaseBranch) {
        return;
      }

      const newCodebaseBranch = editCodebaseBranchObject(codebaseBranch, {
        pipelines: {
          build: values.buildPipeline,
          review: values.reviewPipeline,
          ...(values.securityPipeline && { security: values.securityPipeline }),
        },
      });

      await triggerEditCodebaseBranch({
        data: { codebaseBranch: newCodebaseBranch },
        callbacks: { onSuccess: closeDialog },
      });
    },
    [codebaseBranch, closeDialog, triggerEditCodebaseBranch]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    showToast("Failed to update codebase branch", "error", {
      description: errorMessage,
      duration: 10000,
    });
  }, []);

  const validationContext = React.useMemo(
    () => ({
      // Exclude current branch from existing names check (when editing)
      existingBranchNames: codebaseBranches
        .filter((branch) => branch.spec.branchName !== codebaseBranch?.spec.branchName)
        .map((branch) => branch.spec.branchName),
    }),
    [codebaseBranches, codebaseBranch]
  );

  return (
    <CodebaseBranchFormProvider
      defaultValues={baseDefaultValues}
      validationContext={validationContext}
      onSubmit={handleSubmit}
      onSubmitError={handleSubmitError}
    >
      <DialogHeader>
        <CustomDialogHeader />
      </DialogHeader>
      <DialogBody>
        <Form />
      </DialogBody>
      <DialogFooter>
        <FormActions />
      </DialogFooter>
    </CodebaseBranchFormProvider>
  );
};
