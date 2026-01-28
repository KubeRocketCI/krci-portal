import { Card } from "@/core/components/ui/card";
import { useCodebaseCRUD } from "@/k8s/api/groups/KRCI/Codebase";
import { codebaseLabels, createCodebaseDraftObject } from "@my-project/shared";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { showToast } from "@/core/components/Snackbar";
import { useClusterStore } from "@/k8s/store";
import { InitialSelection } from "./components/InitialSelection";
import { Review } from "./components/Review";
import { Success } from "./components/Success";
import { WizardStepper } from "./components/WizardStepper";
import type { CreateCodebaseFormValues } from "./types";
import { useWizardStore } from "./store";
import { WizardNavigation } from "./components/WizardNavigation";
import { GitAndProjectInfo } from "./components/GitAndProjectInfo";
import { BuildConfig } from "./components/BuildConfig";
import { CreateCodebaseFormProvider } from "./providers/form/provider";
import { useCreateCodebaseForm } from "./providers/form/hooks";
import { routeComponentList } from "../../../list/route";

export const CreateCodebaseWizard: React.FC = () => {
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
            const currentFormPart = useWizardStore.getState().getCurrentFormPart();
            if (currentFormPart) {
              useWizardStore.getState().markStepAsValidated(currentFormPart);
            }
            useWizardStore.getState().setCurrentStepIdx(5); // SUCCESS step
          },
        },
      });
    },
    [triggerCreateCodebase]
  );

  const onSubmitError = React.useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    showToast("Failed to create component", "error", {
      description: errorMessage,
      duration: 10000,
    });
  }, []);

  React.useEffect(() => {
    useWizardStore.getState().reset();
  }, []);

  return (
    <CreateCodebaseFormProvider onSubmit={onSubmit} onSubmitError={onSubmitError}>
      <WizardContent isPending={isPending} />
    </CreateCodebaseFormProvider>
  );
};

interface WizardContentProps {
  isPending: boolean;
}

const WizardContent: React.FC<WizardContentProps> = ({ isPending }) => {
  const form = useCreateCodebaseForm();
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

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
              isSubmitting={isPending}
              backRoute={{
                to: routeComponentList.fullPath,
                params: { clusterName },
              }}
            />
          </div>
        )}
      </div>
    </form>
  );
};
