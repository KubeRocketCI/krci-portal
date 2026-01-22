import { TabPanel } from "@/core/components/TabPanel";
import { useStageCRUD } from "@/k8s/api/groups/KRCI/Stage";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { Button } from "@/core/components/ui/button";
import React from "react";
import { useStore } from "@tanstack/react-form";
import { FORM_STEPPER } from "../../../../constants";
import { STAGE_FORM_NAMES } from "../../../../names";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { useStageForm } from "../../../../providers/form/hooks";

export const FormActions = () => {
  const {
    state: { closeDialog },
  } = useCurrentDialog();

  const form = useStageForm();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);

  const qualityGatesFieldValue = useStore(
    form.store,
    (state) => state.values[STAGE_FORM_NAMES.qualityGates.name] || []
  );

  const handleClose = React.useCallback(() => {
    closeDialog();
    form.reset();
  }, [closeDialog, form]);

  const handleResetFields = React.useCallback(() => {
    form.reset();
  }, [form]);

  const {
    mutations: { stageCreateMutation },
  } = useStageCRUD();

  const isLoading = stageCreateMutation.isPending || isSubmitting;

  const { activeStep, nextStep, prevStep } = useStepperContext();

  const activeTabFormPartName = React.useMemo(() => {
    const validEntry = Object.entries(FORM_STEPPER).find(([, { idx }]) => idx === activeStep);
    return validEntry?.[0];
  }, [activeStep]);

  // Validate specific form fields for the current step
  const handleProceed = React.useCallback(async () => {
    const activeTabFormPartNames = Object.values(STAGE_FORM_NAMES)
      // @ts-expect-error - formPart exists on field definitions
      .filter(({ formPart }) => formPart === activeTabFormPartName)
      .map(({ name }) => name);

    // Validate the fields for this step
    let hasErrors = false;
    for (const fieldName of activeTabFormPartNames) {
      const fieldMeta = form.getFieldMeta(fieldName);
      if (fieldMeta?.errors && fieldMeta.errors.length > 0) {
        hasErrors = true;
        break;
      }
    }

    // Trigger validation on all fields in this step
    form.validateAllFields("change");

    // Check again after validation
    hasErrors = false;
    for (const fieldName of activeTabFormPartNames) {
      const fieldMeta = form.getFieldMeta(fieldName);
      if (fieldMeta?.errors && fieldMeta.errors.length > 0) {
        hasErrors = true;
        break;
      }
    }

    if (!hasErrors) {
      nextStep();
    }
  }, [activeTabFormPartName, nextStep, form]);

  return (
    <div className="flex w-full flex-row justify-between gap-4">
      <div className="flex flex-row gap-2">
        <Button onClick={handleClose} variant="ghost" size="sm">
          Cancel
        </Button>
        <Button onClick={handleResetFields} variant="ghost" size="sm" disabled={!isDirty}>
          Undo Changes
        </Button>
      </div>
      <div>
        <TabPanel value={activeStep} index={FORM_STEPPER.CONFIGURATION.idx}>
          <Button onClick={handleProceed} variant="default" size="sm">
            Next
          </Button>
        </TabPanel>
        <TabPanel value={activeStep} index={FORM_STEPPER.QUALITY_GATES.idx}>
          <div className="flex flex-row gap-2">
            <Button onClick={prevStep} variant="ghost" size="sm">
              Back
            </Button>
            <Button
              onClick={() => form.handleSubmit()}
              variant="default"
              size="sm"
              disabled={
                !isDirty || isLoading || !canSubmit || !qualityGatesFieldValue || !qualityGatesFieldValue.length
              }
            >
              Create
            </Button>
          </div>
        </TabPanel>
      </div>
    </div>
  );
};
