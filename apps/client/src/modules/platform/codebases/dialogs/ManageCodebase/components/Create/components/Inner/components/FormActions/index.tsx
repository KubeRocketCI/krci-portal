import { TabPanel } from "@/core/components/TabPanel";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { ValueOf } from "@/core/types/global";
import { useCodebaseCRUD } from "@/k8s/api/groups/KRCI/Codebase";
import { configurationStepper, mainTabs, selectionStepper } from "@/modules/platform/codebases/dialogs/ManageCodebase/constants";
import { Button } from "@/core/components/ui/button";
import { codebaseCreationStrategy, codebaseLabels, createCodebaseDraftObject } from "@my-project/shared";
import React from "react";
import { useTypedFormContext } from "../../../../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES, NAMES } from "../../../../../../names";
import { useCurrentDialog } from "../../../../../../providers/CurrentDialog/hooks";
import { ManageCodebaseFormValues } from "../../../../../../types";
import { FormActionsProps } from "./types";

export const FormActions = ({ baseDefaultValues, setActiveTab }: FormActionsProps) => {
  const { activeStep, setActiveStep, nextStep, prevStep } = useStepperContext();
  const {
    state: { closeDialog },
  } = useCurrentDialog();

  const {
    reset,
    formState: { isDirty, dirtyFields },
    trigger,
    handleSubmit,
    watch,
    setValue,
    getValues,
  } = useTypedFormContext();

  const typeFieldValue = watch(CODEBASE_FORM_NAMES.type.name);
  const strategyFieldValue = watch(CODEBASE_FORM_NAMES.strategy.name);

  const handleClose = React.useCallback(() => {
    closeDialog();
    setTimeout(() => {
      reset({
        ...baseDefaultValues,
        [CODEBASE_FORM_NAMES.strategy.name]: undefined,
        [CODEBASE_FORM_NAMES.type.name]: undefined,
      });
      setActiveStep(selectionStepper.SELECT_COMPONENT.idx);
      setActiveTab(mainTabs.selection);
    }, 500);
  }, [closeDialog, reset, baseDefaultValues, setActiveStep, setActiveTab]);

  const handleResetFields = React.useCallback(() => {
    reset(baseDefaultValues);
    setValue(CODEBASE_FORM_NAMES.strategy.name, strategyFieldValue, { shouldDirty: true });
    setValue(CODEBASE_FORM_NAMES.type.name, typeFieldValue, { shouldDirty: true });
  }, [strategyFieldValue, typeFieldValue, reset, baseDefaultValues, setValue]);

  const activeTabFormPartName = React.useMemo(() => {
    const validEntry = Object.entries(configurationStepper).find(([, { idx }]) => idx === activeStep);
    return validEntry?.[0];
  }, [activeStep]);

  const handleProceed = React.useCallback(async () => {
    const values = getValues();

    const activeTabFormPartNames = Object.values(CODEBASE_FORM_NAMES)
      .filter((field) => "formPart" in field && field.formPart === activeTabFormPartName)
      .map(({ name }) => name);

    if (values.strategy === codebaseCreationStrategy.clone && !!values.hasCodebaseAuth) {
      activeTabFormPartNames.push(CODEBASE_FORM_NAMES.repositoryLogin.name);
      activeTabFormPartNames.push(CODEBASE_FORM_NAMES.repositoryPasswordOrApiToken.name);
    }

    const hasNoErrors = await trigger(activeTabFormPartNames);

    if (hasNoErrors) {
      nextStep();
    }
  }, [activeTabFormPartName, getValues, nextStep, trigger]);

  const getFirstErrorStepName = React.useCallback((errors: object) => {
    const [firstErrorFieldName] = Object.keys(errors);
    const field = CODEBASE_FORM_NAMES[firstErrorFieldName as ValueOf<typeof NAMES>];
    return "formPart" in field ? field.formPart : undefined;
  }, []);

  const handleValidationError = React.useCallback(
    (errors: object) => {
      if (errors) {
        const firstErrorTabName = getFirstErrorStepName(errors);
        setActiveStep(configurationStepper[firstErrorTabName as keyof typeof configurationStepper]?.idx);
      }
    },
    [getFirstErrorStepName, setActiveStep]
  );

  const onSuccess = React.useCallback(() => {
    // const capitalizedType = capitalizeFirstLetter(typeFieldValue as string);

    // setDialog(SuccessDialog, {
    //   dialogTitle: `Create ${capitalizedType}`,
    //   title: `Your new ${capitalizedType} is created`,
    //   description: `Browse your new ${capitalizedType} and start working with it.`,
    //   link: null,
    // });

    handleClose();
  }, [handleClose]);

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
    async (values: ManageCodebaseFormValues) => {
      const newCodebaseDraft = createCodebaseDraftObject({
        name: values.name,
        gitServer: values.gitServer,
        gitUrlPath: values.gitUrlPath,
        type: values.type,
        buildTool: values.buildTool,
        defaultBranch: values.defaultBranch,
        deploymentScript: values.deploymentScript,
        emptyProject: values.emptyProject,
        framework: values.framework,
        lang: values.lang,
        private: JSON.parse(values.private as unknown as string),
        repository: values.repositoryUrl
          ? {
              url: values.repositoryUrl,
            }
          : null,
        strategy: values.strategy,
        versioning: {
          type: values.versioningType,
          startFrom: values.versioningStartFrom,
        },
        ciTool: values.ciTool,
        labels: {
          [codebaseLabels.codebaseType]: values.type,
        },
      });

      const hasCodebaseAuth = values?.repositoryLogin && values?.repositoryPasswordOrApiToken;

      await triggerCreateCodebase({
        data: {
          codebase: newCodebaseDraft,
          codebaseAuth: hasCodebaseAuth
            ? {
                repositoryLogin: values?.repositoryLogin,
                repositoryPasswordOrApiToken: values?.repositoryPasswordOrApiToken,
              }
            : null,
        },
        callbacks: {
          onSuccess: onSuccess,
        },
      });
    },
    [triggerCreateCodebase, onSuccess]
  );

  const configurationFormIsDirty = Object.keys(dirtyFields).length > 2; // 2 is the number of fields that are always dirty

  return (
    <div className="flex w-full justify-between gap-2">
      <div className="flex gap-1">
        <Button onClick={handleClose} variant="ghost" size="sm">
          Cancel
        </Button>
        <Button onClick={handleResetFields} variant="ghost" size="sm" disabled={!configurationFormIsDirty}>
          Undo Changes
        </Button>
      </div>
      <div>
        <TabPanel value={activeStep} index={configurationStepper.CODEBASE_INFO.idx}>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                prevStep();
                setActiveTab(mainTabs.selection);
              }}
              variant="ghost"
              size="sm"
            >
              Back
            </Button>
            <Button onClick={handleProceed} variant="default" size="sm">
              Next
            </Button>
          </div>
        </TabPanel>
        <TabPanel value={activeStep} index={configurationStepper.ADVANCED_SETTINGS.idx}>
          <div className="flex gap-2">
            <Button onClick={prevStep} variant="ghost" size="sm">
              Back
            </Button>
            <Button
              onClick={handleSubmit(onSubmit, handleValidationError)}
              variant="default"
              size="sm"
              disabled={!isDirty || isPending}
            >
              Create
            </Button>
          </div>
        </TabPanel>
      </div>
    </div>
  );
};
