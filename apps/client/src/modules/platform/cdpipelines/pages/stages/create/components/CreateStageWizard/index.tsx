import { Card } from "@/core/components/ui/card";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useStageCRUD } from "@/k8s/api/groups/KRCI/Stage";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStageDraftObject } from "@my-project/shared";
import React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useShallow } from "zustand/react/shallow";
import { BasicConfiguration } from "./components/BasicConfiguration";
import { PipelineConfiguration } from "./components/PipelineConfiguration";
import { QualityGates } from "./components/QualityGates";
import { Review } from "./components/Review";
import { Success } from "./components/Success";
import { WizardStepper } from "./components/WizardStepper";
import { WizardNavigation } from "./components/WizardNavigation";
import { useDefaultValues, useCDPipelineData } from "./hooks/useDefaultValues";
import { createStageFormSchema, CreateStageFormValues, CreateStageFormInput } from "./names";
import { useWizardStore } from "./store";

export const CreateStageWizard: React.FC = () => {
  const { cdPipelineIsLoading, cdPipelineError, otherStagesIsLoading } = useCDPipelineData();
  const baseDefaultValues = useDefaultValues();

  const form = useForm<CreateStageFormInput, unknown, CreateStageFormValues>({
    mode: "onChange",
    resolver: zodResolver(createStageFormSchema),
    defaultValues: {
      ...baseDefaultValues,
    },
  });

  React.useEffect(() => {
    form.reset(baseDefaultValues);
  }, [baseDefaultValues, form]);

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
    <FormProvider {...form}>
      <WizardContent />
    </FormProvider>
  );
};

const WizardContent: React.FC = () => {
  const { currentStepIdx, goToNextStep, goToPreviousStep, getCurrentFormPart } = useWizardStore(
    useShallow((state) => ({
      currentStepIdx: state.currentStepIdx,
      goToNextStep: state.goToNextStep,
      goToPreviousStep: state.goToPreviousStep,
      getCurrentFormPart: state.getCurrentFormPart,
    }))
  );

  const currentFormPart = getCurrentFormPart();

  const { trigger, handleSubmit: formHandleSubmit } = useFormContext<
    CreateStageFormInput,
    unknown,
    CreateStageFormValues
  >();

  const {
    triggerCreateStage,
    mutations: { stageCreateMutation },
  } = useStageCRUD();

  const isPending = React.useMemo(() => stageCreateMutation.isPending, [stageCreateMutation.isPending]);

  const onSubmit = React.useCallback(
    async (values: CreateStageFormValues) => {
      const isValid = await trigger();

      if (!isValid) {
        return;
      }

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
            if (currentFormPart) {
              useWizardStore.getState().markStepAsValidated(currentFormPart);
            }
            useWizardStore.getState().setCurrentStepIdx(5); // SUCCESS step
          },
        },
      });
    },
    [trigger, triggerCreateStage, currentFormPart]
  );

  const handleSubmit = formHandleSubmit(onSubmit);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
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
              onSubmit={handleSubmit}
              isSubmitting={isPending}
            />
          </div>
        )}
      </div>
    </div>
  );
};
