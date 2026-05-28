import React from "react";
import { DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { useStageCRUD } from "@/k8s/api/groups/KRCI/Stage";
import { editStageObject } from "@my-project/shared";
import type { Stage } from "@my-project/shared";
import { FormContent } from "./components/FormContent";
import { FormActions } from "./components/FormActions";
import type { EditStageFormValues } from "./types";
import { EditStageFormProvider } from "./providers/form/provider";
import { FormGuideToggleButton, FormGuidePanel } from "@/core/components/FormGuide";
import { EditStageDataProvider } from "./providers/data/provider";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";

export interface EditStageFormProps {
  stage: Stage;
  onClose: () => void;
}

export const EditStageForm: React.FC<EditStageFormProps> = ({ stage, onClose }) => {
  const { triggerEditStage, mutations } = useStageCRUD();
  const { stageEditMutation } = mutations;

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleSubmit = React.useCallback(
    async (values: EditStageFormValues) => {
      if (!stage) return;

      setSubmitError(null);

      // Remove the 'id' field from qualityGates as it's only used for form state
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const qualityGatesForSubmit = values.qualityGates.map(({ id: _id, ...rest }) => rest);

      const updatedStage = editStageObject(stage, {
        triggerType: values.triggerType as "Auto" | "Manual" | "Auto-stable",
        triggerTemplate: values.triggerTemplate,
        cleanTemplate: values.cleanTemplate,
        qualityGates: qualityGatesForSubmit,
      });

      await triggerEditStage({
        data: { stage: updatedStage },
        callbacks: { onSuccess: () => onClose() },
      });
    },
    [stage, triggerEditStage, onClose]
  );

  const onSubmitError = React.useCallback((error: unknown) => {
    console.error("Failed to prepare environment update:", error);
    setSubmitError("Failed to prepare the environment update. Please review the form values and try again.");
  }, []);

  const requestError = stageEditMutation.error as RequestError | null;

  return (
    <EditStageDataProvider stage={stage} closeDialog={onClose}>
      <EditStageFormProvider stage={stage} onSubmit={handleSubmit} onSubmitError={onSubmitError}>
        <DialogHeader>
          <div className="flex flex-row items-start justify-between gap-2">
            <div className="flex flex-col gap-4">
              <DialogTitle>{`Edit ${stage?.spec?.name || "Environment"}`}</DialogTitle>
            </div>
            <FormGuideToggleButton />
          </div>
        </DialogHeader>
        <DialogBody className="flex min-h-0">
          <div className="flex min-h-0 flex-1 gap-4">
            <div className="min-h-0 flex-1 overflow-y-auto p-0.5">
              <div className="flex flex-col gap-4">
                {(submitError || requestError) && (
                  <Alert variant="destructive" title="Failed to update environment">
                    {submitError ?? (requestError ? getK8sErrorMessage(requestError) : "")}
                  </Alert>
                )}
                <FormContent />
              </div>
            </div>
            <FormGuidePanel />
          </div>
        </DialogBody>
        <DialogFooter>
          <FormActions />
        </DialogFooter>
      </EditStageFormProvider>
    </EditStageDataProvider>
  );
};
