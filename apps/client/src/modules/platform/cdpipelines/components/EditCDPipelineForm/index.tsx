import React from "react";
import { DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { useCDPipelineCRUD } from "@/k8s/api/groups/KRCI/CDPipeline";
import { editCDPipelineObject } from "@my-project/shared";
import type { CDPipeline } from "@my-project/shared";
import { FormContent } from "./components/FormContent";
import { Review } from "./components/Review";
import { WizardNavigation } from "./components/WizardNavigation";
import { WizardStepper } from "./components/WizardStepper";
import type { EditCDPipelineFormValues } from "./types";
import { EditCDPipelineFormProvider } from "./providers/form/provider";
import { FormGuideToggleButton, FormGuidePanel } from "@/core/components/FormGuide";
import { EditCDPipelineDataProvider } from "./providers/data/provider";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";
import { useEditWizardStore } from "./store";
import { useShallow } from "zustand/react/shallow";

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
  const isSubmitting = cdPipelineEditMutation.isPending;

  // Reset wizard state on mount and unmount
  React.useEffect(() => {
    useEditWizardStore.getState().reset();
    return () => {
      useEditWizardStore.getState().reset();
    };
  }, []);

  return (
    <EditCDPipelineDataProvider cdPipeline={cdPipeline}>
      <EditCDPipelineFormProvider cdPipeline={cdPipeline} onSubmit={handleSubmit} onSubmitError={onSubmitError}>
        <WizardContent
          cdPipeline={cdPipeline}
          onClose={onClose}
          requestError={requestError}
          isSubmitting={isSubmitting}
        />
      </EditCDPipelineFormProvider>
    </EditCDPipelineDataProvider>
  );
};

interface WizardContentProps {
  cdPipeline: CDPipeline;
  onClose: () => void;
  requestError: RequestError | null;
  isSubmitting: boolean;
}

const WizardContent: React.FC<WizardContentProps> = ({ cdPipeline, onClose, requestError, isSubmitting }) => {
  const { currentStepIdx, goToNextStep, goToPreviousStep } = useEditWizardStore(
    useShallow((state) => ({
      currentStepIdx: state.currentStepIdx,
      goToNextStep: state.goToNextStep,
      goToPreviousStep: state.goToPreviousStep,
    }))
  );

  const isEditStep = currentStepIdx === 1;
  const isReviewStep = currentStepIdx === 2;

  return (
    <>
      <DialogHeader>
        <div className="flex flex-row items-start justify-between gap-2">
          <div className="flex w-full flex-col gap-4">
            <DialogTitle>{`Edit ${cdPipeline?.metadata.name}`}</DialogTitle>
            <WizardStepper currentStepIdx={currentStepIdx} />
          </div>
          {isEditStep && <FormGuideToggleButton />}
        </div>
      </DialogHeader>
      <DialogBody className="flex min-h-0">
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="min-h-0 flex-1 overflow-y-auto p-0.5">
            <div className="flex flex-col gap-4">
              {requestError && (
                <Alert variant="destructive" title="Failed to update deployment flow">
                  {getK8sErrorMessage(requestError)}
                </Alert>
              )}
              {isEditStep && <FormContent />}
              {isReviewStep && <Review />}
            </div>
          </div>
          {isEditStep && <FormGuidePanel />}
        </div>
      </DialogBody>
      <DialogFooter>
        <WizardNavigation
          onBack={goToPreviousStep}
          onNext={goToNextStep}
          onClose={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogFooter>
    </>
  );
};
