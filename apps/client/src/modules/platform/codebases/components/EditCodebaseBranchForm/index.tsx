import React from "react";
import { DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { useCodebaseBranchCRUD } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { editCodebaseBranchObject } from "@my-project/shared";
import type { CodebaseBranch } from "@my-project/shared";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { EditCodebaseBranchFormProvider } from "./providers/form/provider";
import { FormGuideToggleButton, FormGuidePanel } from "@/core/components/FormGuide";
import type { EditCodebaseBranchFormValues } from "./types";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";

export interface EditCodebaseBranchFormProps {
  codebaseBranch: CodebaseBranch;
  isProtected?: boolean;
  onClose: () => void;
}

export const EditCodebaseBranchForm: React.FC<EditCodebaseBranchFormProps> = ({
  codebaseBranch,
  isProtected,
  onClose,
}) => {
  const { triggerEditCodebaseBranch, mutations } = useCodebaseBranchCRUD();
  const { codebaseBranchEditMutation } = mutations;

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const defaultValues = React.useMemo(
    () => ({
      buildPipeline: codebaseBranch?.spec?.pipelines?.build || "",
      reviewPipeline: codebaseBranch?.spec?.pipelines?.review || "",
      securityPipeline: codebaseBranch?.spec?.pipelines?.security || "",
    }),
    [codebaseBranch]
  );

  const pipelines = React.useMemo(
    () => ({
      build: codebaseBranch?.spec?.pipelines?.build,
      review: codebaseBranch?.spec?.pipelines?.review,
      security: codebaseBranch?.spec?.pipelines?.security,
    }),
    [codebaseBranch]
  );

  const handleSubmit = React.useCallback(
    async (values: EditCodebaseBranchFormValues) => {
      setSubmitError(null);

      const newCodebaseBranch = editCodebaseBranchObject(codebaseBranch, {
        pipelines: {
          build: values.buildPipeline,
          review: values.reviewPipeline,
          ...(values.securityPipeline && { security: values.securityPipeline }),
        },
      });

      await triggerEditCodebaseBranch({
        data: { codebaseBranch: newCodebaseBranch },
        callbacks: { onSuccess: onClose },
      });
    },
    [codebaseBranch, onClose, triggerEditCodebaseBranch]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Failed to prepare codebase branch update:", error);
    setSubmitError("Failed to prepare the codebase branch update. Please review the form values and try again.");
  }, []);

  const requestError = codebaseBranchEditMutation.error as RequestError | null;

  return (
    <EditCodebaseBranchFormProvider
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onSubmitError={handleSubmitError}
    >
      <DialogHeader>
        <div className="flex flex-row items-start justify-between gap-2">
          <div className="flex flex-col gap-4">
            <DialogTitle className="text-xl font-medium">{`Edit ${codebaseBranch.spec.branchName}`}</DialogTitle>
          </div>
          <FormGuideToggleButton />
        </div>
      </DialogHeader>
      <DialogBody className="flex min-h-0">
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="min-h-0 flex-1 overflow-y-auto p-0.5">
            <div className="flex flex-col gap-4">
              {(submitError || requestError) && (
                <Alert variant="destructive" title="Failed to update codebase branch">
                  {submitError ?? (requestError ? getK8sErrorMessage(requestError) : "")}
                </Alert>
              )}
              <Form pipelines={pipelines} />
            </div>
          </div>
          <FormGuidePanel />
        </div>
      </DialogBody>
      <DialogFooter>
        <FormActions isProtected={isProtected} onClose={onClose} />
      </DialogFooter>
    </EditCodebaseBranchFormProvider>
  );
};
