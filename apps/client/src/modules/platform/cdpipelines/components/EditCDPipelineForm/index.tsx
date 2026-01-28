import React from "react";
import { DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { useCDPipelineCRUD } from "@/k8s/api/groups/KRCI/CDPipeline";
import { editCDPipelineObject } from "@my-project/shared";
import type { CDPipeline } from "@my-project/shared";
import { FormContent } from "./components/FormContent";
import { FormActions } from "./components/FormActions";
import type { EditCDPipelineFormValues } from "./types";
import { EditCDPipelineFormProvider } from "./providers/form/provider";
import { EditCDPipelineDataProvider } from "./providers/data/provider";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";

export interface EditCDPipelineFormProps {
  cdPipeline: CDPipeline;
  onClose: () => void;
}

export const EditCDPipelineForm: React.FC<EditCDPipelineFormProps> = ({ cdPipeline, onClose }) => {
  const { triggerEditCDPipeline, mutations } = useCDPipelineCRUD();
  const { cdPipelineEditMutation } = mutations;

  const handleSubmit = React.useCallback(
    async (values: EditCDPipelineFormValues) => {
      if (!cdPipeline) return;

      const updatedCDPipeline = editCDPipelineObject(cdPipeline, {
        description: values.description,
        applications: values.applications,
        inputDockerStreams: values.inputDockerStreams,
        applicationsToPromote: values.applicationsToPromote,
      });

      await triggerEditCDPipeline({
        data: { cdPipeline: updatedCDPipeline },
        callbacks: { onSuccess: () => onClose() },
      });
    },
    [cdPipeline, triggerEditCDPipeline, onClose]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSubmitError = React.useCallback((_error: unknown) => {}, []);

  const requestError = cdPipelineEditMutation.error as RequestError | null;

  return (
    <EditCDPipelineDataProvider cdPipeline={cdPipeline}>
      <EditCDPipelineFormProvider cdPipeline={cdPipeline} onSubmit={handleSubmit} onSubmitError={onSubmitError}>
        <DialogHeader>
          <div className="flex flex-row items-start justify-between gap-2">
            <div className="flex flex-col gap-4">
              <DialogTitle>{`Edit ${cdPipeline?.metadata.name}`}</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            {requestError && (
              <Alert variant="destructive" title="Failed to update deployment flow">
                {getK8sErrorMessage(requestError)}
              </Alert>
            )}
            <FormContent />
          </div>
        </DialogBody>
        <DialogFooter>
          <FormActions onClose={onClose} />
        </DialogFooter>
      </EditCDPipelineFormProvider>
    </EditCDPipelineDataProvider>
  );
};
