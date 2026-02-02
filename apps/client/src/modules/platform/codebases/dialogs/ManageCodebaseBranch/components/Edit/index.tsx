import React from "react";
import { DialogBody, DialogFooter, DialogHeader } from "@/core/components/ui/dialog";
import { DialogHeader as CustomDialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { CodebaseBranchFormProvider } from "../../providers/form/provider";
import { editCodebaseBranchFormSchema, type EditCodebaseBranchFormValues } from "../../schema";
import { useCodebaseBranchCRUD } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { editCodebaseBranchObject } from "@my-project/shared";
import { useCurrentDialog } from "../../providers/CurrentDialog/hooks";
import { showToast } from "@/core/components/Snackbar";

export const Edit = () => {
  const baseDefaultValues = useDefaultValues();
  const {
    props: { codebaseBranch },
    state: { closeDialog },
  } = useCurrentDialog();

  const { triggerEditCodebaseBranch } = useCodebaseBranchCRUD();

  const handleSubmit = React.useCallback(
    async (values: EditCodebaseBranchFormValues) => {
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

  return (
    <CodebaseBranchFormProvider
      defaultValues={baseDefaultValues}
      formSchema={editCodebaseBranchFormSchema}
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
