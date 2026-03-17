import { Card } from "@/core/components/ui/card";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useStageCRUD } from "@/k8s/api/groups/KRCI/Stage";
import { createStageDraftObject } from "@my-project/shared";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { showToast } from "@/core/components/Snackbar";
import { useClusterStore } from "@/k8s/store";
import { routeStageCreate } from "../../route";
import { routeCDPipelineDetails } from "@/modules/platform/cdpipelines/pages/details/route";
import { BasicConfiguration } from "./components/BasicConfiguration";
import { PipelineConfiguration } from "./components/PipelineConfiguration";
import { QualityGates } from "./components/QualityGates";
import { Review } from "./components/Review";
import { Success } from "./components/Success";
import { WizardStepper } from "./components/WizardStepper";
import { WizardNavigation } from "./components/WizardNavigation";
import { useCDPipelineData } from "./hooks/useDefaultValues";
import { CreateStageFormValues } from "./names";
import { useWizardStore } from "./store";
import { CreateStageFormProvider } from "./providers/form/provider";
import { useCreateStageForm } from "./providers/form/hooks";

export const CreateStageWizard: React.FC = () => {
  const { cdPipelineIsLoading, cdPipelineError, otherStagesIsLoading } = useCDPipelineData();
  const {
    triggerCreateStage,
    mutations: { stageCreateMutation },
  } = useStageCRUD();

  const isPending = React.useMemo(() => stageCreateMutation.isPending, [stageCreateMutation.isPending]);

  const onSubmit = React.useCallback(
    async (values: CreateStageFormValues) => {
      const newStage = createStageDraftObject({
        name: values.name,
        description: values.description,
        qualityGates: values.qualityGates.map((el) => ({
          qualityGateType: el.qualityGateType,
          stepName: el.stepName,
          autotestName: el.autotestName,
          branchName: el.branchName,
        })),
        cdPipeline: values.cdPipeline,
        namespace: values.deployNamespace,
        clusterName: values.cluster,
        order: values.order,
        source: {
          type: values.sourceType as "default" | "library",
          library: {
            name: values.sourceLibraryName,
            branch: values.sourceLibraryBranch,
          },
        },
        triggerTemplate: values.triggerTemplate,
        cleanTemplate: values.cleanTemplate,
        triggerType: values.triggerType as "Auto" | "Manual" | "Auto-stable",
      });

      await triggerCreateStage({
        data: {
          stage: newStage,
        },
        callbacks: {
          onSuccess: () => {
            const currentFormPart = useWizardStore.getState().getCurrentFormPart();
            if (currentFormPart) {
              useWizardStore.getState().markStepAsValidated(currentFormPart);
            }
            useWizardStore.getState().setCurrentStepIdx(5); // SUCCESS step
          },
        },
      });
    },
    [triggerCreateStage]
  );

  const onSubmitError = React.useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    showToast("Failed to create environment", "error", {
      description: errorMessage,
      duration: 10000,
    });
  }, []);

  React.useEffect(() => {
    useWizardStore.getState().reset();
  }, []);

  if (cdPipelineError) {
    return <ErrorContent error={cdPipelineError} />;
  }

  if (cdPipelineIsLoading || otherStagesIsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingWrapper isLoading={true}>
          <div />
        </LoadingWrapper>
      </div>
    );
  }

  return (
    <CreateStageFormProvider onSubmit={onSubmit} onSubmitError={onSubmitError}>
      <WizardContent isPending={isPending} />
    </CreateStageFormProvider>
  );
};

interface WizardContentProps {
  isPending: boolean;
}

const WizardContent: React.FC<WizardContentProps> = ({ isPending }) => {
  const form = useCreateStageForm();
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const { namespace, cdPipeline } = routeStageCreate.useParams();

  const { currentStepIdx, goToNextStep, goToPreviousStep } = useWizardStore(
    useShallow((state) => ({
      currentStepIdx: state.currentStepIdx,
      goToNextStep: state.goToNextStep,
      goToPreviousStep: state.goToPreviousStep,
    }))
  );

  const handleSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {currentStepIdx !== 5 && (
          <div className="shrink-0">
            <WizardStepper currentStepIdx={currentStepIdx} />
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          <Card className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 shadow-none">
            {currentStepIdx === 1 && <BasicConfiguration />}
            {currentStepIdx === 2 && <PipelineConfiguration />}
            {currentStepIdx === 3 && <QualityGates />}
            {currentStepIdx === 4 && <Review />}
            {currentStepIdx === 5 && <Success />}
          </Card>
        </div>

        {currentStepIdx !== 5 && (
          <div className="shrink-0">
            <WizardNavigation
              onBack={goToPreviousStep}
              onNext={goToNextStep}
              isSubmitting={isPending}
              backRoute={{
                to: routeCDPipelineDetails.fullPath,
                params: { clusterName, namespace, name: cdPipeline },
              }}
            />
          </div>
        )}
      </div>
    </form>
  );
};
