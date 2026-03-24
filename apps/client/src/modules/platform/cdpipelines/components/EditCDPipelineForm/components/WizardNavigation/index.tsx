import { Button } from "@/core/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useEditWizardStore } from "../../store";
import { useEditCDPipelineForm } from "../../providers/form/hooks";
import { useHasChanges } from "../../hooks/useHasChanges";
import { useEditCDPipelineData } from "../../providers/data/hooks";
import { useDefaultValues } from "../../hooks/useDefaultValues";

interface WizardNavigationProps {
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  onBack,
  onNext,
  onClose,
  isSubmitting = false,
}) => {
  const { currentStepIdx } = useEditWizardStore(
    useShallow((state) => ({
      currentStepIdx: state.currentStepIdx,
    }))
  );

  const form = useEditCDPipelineForm();
  const hasChanges = useHasChanges();
  const { cdPipeline } = useEditCDPipelineData();
  const defaultValues = useDefaultValues(cdPipeline);

  const isEditStep = currentStepIdx === 1;
  const isReviewStep = currentStepIdx === 2;

  const handleUndoChanges = React.useCallback(() => {
    // Reset form to original values
    Object.entries(defaultValues).forEach(([key, value]) => {
      form.setFieldValue(key as never, value as never);
    });
  }, [form, defaultValues]);

  const handleNext = React.useCallback(async () => {
    if (isEditStep) {
      // Touch all registered fields so validation errors are displayed
      const fieldNames = Object.keys(form.store.state.fieldMeta);
      for (const fieldName of fieldNames) {
        form.setFieldMeta(fieldName as never, (prev) => ({ ...prev, isTouched: true }));
      }

      // Validate all field-level validators
      await form.validateAllFields("change");

      // Check field-level errors (errorMap only holds form-level errors)
      let hasErrors = false;
      for (const meta of Object.values(form.store.state.fieldMeta)) {
        if (meta?.errors && meta.errors.length > 0) {
          hasErrors = true;
          break;
        }
      }

      if (!hasErrors) {
        onNext();
      }
    }
  }, [isEditStep, form, onNext]);

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" onClick={onClose} size="sm" disabled={isSubmitting}>
          Cancel
        </Button>
        {hasChanges && (
          <Button type="button" variant="ghost" onClick={handleUndoChanges} size="sm" disabled={isSubmitting}>
            Undo Changes
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {currentStepIdx > 1 && (
          <Button type="button" variant="outline" onClick={onBack} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}

        {isEditStep ? (
          <Button type="button" onClick={handleNext} size="sm" disabled={!hasChanges}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : isReviewStep ? (
          <Button onClick={() => form.handleSubmit()} disabled={isSubmitting || !hasChanges} size="sm" type="button">
            Apply Changes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
};
