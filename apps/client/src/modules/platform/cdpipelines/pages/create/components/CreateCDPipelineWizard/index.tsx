import { Card } from "@/core/components/ui/card";
import { useCDPipelineCRUD } from "@/k8s/api/groups/KRCI/CDPipeline";
import { createCDPipelineDraftObject } from "@my-project/shared";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { showToast } from "@/core/components/Snackbar";
import { Review } from "./components/Review";
import { Success } from "./components/Success";
import { WizardStepper } from "./components/WizardStepper";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { useWizardStore } from "./store";
import { WizardNavigation } from "./components/WizardNavigation";
import { PipelineConfiguration } from "./components/PipelineConfiguration";
import { CreateCDPipelineFormProvider } from "./providers/form/provider";
import { CreateCDPipelineFormValues } from "./types";
import { Applications } from "./components/Applications";
import { routeCDPipelineList } from "../../../list/route";
import { useClusterStore } from "@/k8s/store";

export const CreateCDPipelineWizard: React.FC = () => {
  const baseDefaultValues = useDefaultValues();

  const {
    triggerCreateCDPipeline,
    mutations: { cdPipelineCreateMutation },
  } = useCDPipelineCRUD();

  const handleSubmit = React.useCallback(
    async (values: CreateCDPipelineFormValues) => {
      const newCDPipeline = createCDPipelineDraftObject({
        name: values.name,
        applications: values.applications,
        deploymentType: values.deploymentType,
        inputDockerStreams: values.inputDockerStreams,
        applicationsToPromote: values.applicationsToPromote,
        description: values.description,
      });

      await triggerCreateCDPipeline({
        data: {
          cdPipeline: newCDPipeline,
        },
        callbacks: {
          onSuccess: () => {
            const currentFormPart = useWizardStore.getState().getCurrentFormPart();
            if (currentFormPart) {
              useWizardStore.getState().markStepAsValidated(currentFormPart);
            }
            useWizardStore.getState().setCurrentStepIdx(4); // SUCCESS step
          },
        },
      });
    },
    [triggerCreateCDPipeline]
  );

  const onSubmitError = React.useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    showToast("Failed to create deployment flow", "error", {
      description: errorMessage,
      duration: 10000,
    });
  }, []);

  React.useEffect(() => {
    useWizardStore.getState().reset();
  }, []);

  return (
    <CreateCDPipelineFormProvider
      defaultValues={baseDefaultValues}
      onSubmit={handleSubmit}
      onSubmitError={onSubmitError}
    >
      <WizardContent isPending={cdPipelineCreateMutation.isPending} />
    </CreateCDPipelineFormProvider>
  );
};

interface WizardContentProps {
  isPending: boolean;
}

const WizardContent: React.FC<WizardContentProps> = ({ isPending }) => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const { currentStepIdx, goToNextStep, goToPreviousStep } = useWizardStore(
    useShallow((state) => ({
      currentStepIdx: state.currentStepIdx,
      goToNextStep: state.goToNextStep,
      goToPreviousStep: state.goToPreviousStep,
    }))
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {currentStepIdx !== 4 && (
          <div className="shrink-0">
            <WizardStepper currentStepIdx={currentStepIdx} />
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          <Card className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 shadow-none">
            {currentStepIdx === 1 && <Applications />}
            {currentStepIdx === 2 && <PipelineConfiguration />}
            {currentStepIdx === 3 && <Review />}
            {currentStepIdx === 4 && <Success />}
          </Card>
        </div>

        {currentStepIdx !== 4 && (
          <div className="shrink-0">
            <WizardNavigation
              onBack={goToPreviousStep}
              onNext={goToNextStep}
              isSubmitting={isPending}
              backRoute={{
                to: routeCDPipelineList.fullPath,
                params: { clusterName },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
