import { Card } from "@/core/components/ui/card";
import { useCDPipelineCRUD } from "@/k8s/api/groups/KRCI/CDPipeline";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCDPipelineDraftObject } from "@my-project/shared";
import React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useShallow } from "zustand/react/shallow";
import { Review } from "./components/Review";
import { Success } from "./components/Success";
import { WizardStepper } from "./components/WizardStepper";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { createCDPipelineFormSchema, CreateCDPipelineFormValues } from "./names";
import { useWizardStore } from "./store";
import { WizardNavigation } from "./components/WizardNavigation";
import { Applications } from "./components/Applications";
import { PipelineConfiguration } from "./components/PipelineConfiguration";

export const CreateCDPipelineWizard: React.FC = () => {
  const baseDefaultValues = useDefaultValues();

  const form = useForm<CreateCDPipelineFormValues>({
    mode: "onChange",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createCDPipelineFormSchema) as any,
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

  const { trigger, handleSubmit: formHandleSubmit, formState } = useFormContext<CreateCDPipelineFormValues>();

  const {
    triggerCreateCDPipeline,
    mutations: { cdPipelineCreateMutation },
  } = useCDPipelineCRUD();

  const isPending = React.useMemo(() => cdPipelineCreateMutation.isPending, [cdPipelineCreateMutation.isPending]);

  const onSubmit = React.useCallback(
    async (values: CreateCDPipelineFormValues) => {
      const isValid = await trigger();

      if (!isValid) {
        return;
      }

      const newCDPipeline = createCDPipelineDraftObject({
        name: values.name,
        applications: values.applications,
        deploymentType: values.deploymentType,
        inputDockerStreams: values.inputDockerStreams,
        applicationsToPromote: values.applicationsToPromote,
        description: values.description,
      });

      triggerCreateCDPipeline({
        data: {
          cdPipeline: newCDPipeline,
        },
        callbacks: {
          onSuccess: () => {
            if (currentFormPart) {
              useWizardStore.getState().markStepAsValidated(currentFormPart);
            }
            useWizardStore.getState().setCurrentStepIdx(4); // SUCCESS step
          },
        },
      });
    },
    [trigger, triggerCreateCDPipeline, currentFormPart]
  );

  const handleSubmit = formHandleSubmit(onSubmit, (errors) => {
    console.log("Form validation errors:", errors);
    console.log("Form state errors:", formState.errors);
  });

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
              onSubmit={handleSubmit}
              isSubmitting={isPending}
            />
          </div>
        )}
      </div>
    </div>
  );
};
