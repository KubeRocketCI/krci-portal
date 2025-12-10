import { Card } from "@/core/components/ui/card";
import { useCodebaseCRUD } from "@/k8s/api/groups/KRCI/Codebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { codebaseLabels, createCodebaseDraftObject } from "@my-project/shared";
import React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useShallow } from "zustand/react/shallow";
import { InitialSelection } from "./components/InitialSelection";
import { Review } from "./components/Review";
import { Success } from "./components/Success";
import { WizardStepper } from "./components/WizardStepper";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { createCodebaseFormSchema, CreateCodebaseFormValues } from "./names";
import { useWizardStore } from "./store";
import { WizardNavigation } from "./components/WizardNavigation";
import { GitAndProjectInfo } from "./components/GitAndProjectInfo";
import { BuildConfig } from "./components/BuildConfig";

export const CreateCodebaseWizard: React.FC = () => {
  const baseDefaultValues = useDefaultValues();

  const form = useForm<CreateCodebaseFormValues>({
    mode: "onChange",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createCodebaseFormSchema) as any,
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

  const { trigger, handleSubmit: formHandleSubmit, formState } = useFormContext<CreateCodebaseFormValues>();

  const {
    triggerCreateCodebase,
    mutations: { codebaseCreateMutation, codebaseSecretCreateMutation, codebaseSecretDeleteMutation },
  } = useCodebaseCRUD();

  const isPending = React.useMemo(
    () =>
      codebaseCreateMutation.isPending ||
      codebaseSecretCreateMutation.isPending ||
      codebaseSecretDeleteMutation.isPending,
    [codebaseCreateMutation.isPending, codebaseSecretCreateMutation.isPending, codebaseSecretDeleteMutation.isPending]
  );

  const onSubmit = React.useCallback(
    async (values: CreateCodebaseFormValues) => {
      const isValid = await trigger();

      if (!isValid) {
        return;
      }

      const newCodebaseDraft = createCodebaseDraftObject({
        name: values.name,
        labels: {
          [codebaseLabels.codebaseType]: values.type,
        },
        branchToCopyInDefaultBranch: values.branchToCopyInDefaultBranch,
        buildTool: values.buildTool,
        ciTool: values.ciTool,
        commitMessagePattern: values.commitMessagePattern,
        defaultBranch: values.defaultBranch,
        deploymentScript: values.deploymentScript,
        description: values.description,
        disablePutDeployTemplates: values.disablePutDeployTemplates,
        emptyProject: values.emptyProject,
        framework: values.framework,
        gitServer: values.gitServer,
        gitUrlPath: values.gitUrlPath || "",
        jiraIssueMetadataPayload: values.jiraIssueMetadataPayload,
        jiraServer: values.jiraServer,
        lang: values.lang,
        private: values.private,
        repositoryUrl: values.repositoryUrl ?? null,
        strategy: values.strategy,
        testReportFramework: values.testReportFramework,
        ticketNamePattern: values.ticketNamePattern,
        type: values.type,
        versioningType: values.versioningType,
        versioningStartFrom: values.versioningStartFrom,
      });

      const hasCodebaseAuth =
        values?.ui_hasCodebaseAuth && values?.ui_repositoryLogin && values?.ui_repositoryPasswordOrApiToken;

      await triggerCreateCodebase({
        data: {
          codebase: newCodebaseDraft,
          codebaseAuth: hasCodebaseAuth
            ? {
                repositoryLogin: values.ui_repositoryLogin!,
                repositoryPasswordOrApiToken: values.ui_repositoryPasswordOrApiToken!,
              }
            : null,
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
    [trigger, triggerCreateCodebase, currentFormPart]
  );

  const handleSubmit = formHandleSubmit(onSubmit, (errors) => {
    console.log("Form validation errors:", errors);
    console.log("Form state errors:", formState.errors);
  });

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
            {currentStepIdx === 1 && <InitialSelection />}
            {currentStepIdx === 2 && <GitAndProjectInfo />}
            {currentStepIdx === 3 && <BuildConfig />}
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
