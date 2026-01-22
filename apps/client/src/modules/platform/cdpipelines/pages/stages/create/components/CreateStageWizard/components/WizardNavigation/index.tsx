import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { useClusterStore } from "@/k8s/store";
import { Link, LinkProps } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Rocket } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { routeStageCreate } from "../../../../route";
import { CREATE_FORM_PARTS } from "../../names";
import { NAVIGABLE_STEP_IDXS, useWizardStore } from "../../store";
import { routeCDPipelineDetails } from "@/modules/platform/cdpipelines/pages/details/route";
import { useCreateStageForm } from "../../providers/form/hooks";

interface WizardNavigationProps {
  onBack: () => void;
  onNext: () => void;
  isSubmitting?: boolean;
  backRoute?: Pick<LinkProps, "to" | "params">;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  onBack,
  onNext,
  isSubmitting = false,
  backRoute,
}) => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const { namespace, cdPipeline } = routeStageCreate.useParams();
  const form = useCreateStageForm();

  const { currentStepIdx, getCurrentFormPart } = useWizardStore(
    useShallow((state) => ({
      currentStepIdx: state.currentStepIdx,
      getCurrentFormPart: state.getCurrentFormPart,
    }))
  );

  const currentFormPart = getCurrentFormPart();
  const currentStepIndex = NAVIGABLE_STEP_IDXS.indexOf(currentStepIdx);
  const totalSteps = NAVIGABLE_STEP_IDXS.length;

  const handleContinue = React.useCallback(async () => {
    if (currentFormPart) {
      const stepFields = CREATE_FORM_PARTS[currentFormPart];

      if (stepFields) {
        for (const fieldName of stepFields) {
          form.setFieldMeta(fieldName, (prev) => ({ ...prev, isTouched: true }));
        }

        await form.validate("change");

        let hasStepErrors = false;
        for (const fieldName of stepFields) {
          const fieldMeta = form.getFieldMeta(fieldName);
          const fieldErrors = fieldMeta?.errors || [];

          if (fieldErrors.length > 0) {
            hasStepErrors = true;
            break;
          }
        }

        // Only proceed if no errors in current step
        if (!hasStepErrors) {
          onNext();
        }
      } else {
        onNext();
      }
    } else {
      // For steps without form fields (like REVIEW), just proceed
      onNext();
    }
  }, [currentFormPart, onNext, form]);

  return (
    <Card className="p-3 shadow-none">
      <div className="flex items-center justify-between">
        {currentStepIndex === 0 && backRoute ? (
          <Button variant="outline" asChild size="sm">
            <Link to={backRoute.to} params={backRoute.params}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        ) : (
          <Button variant="outline" onClick={onBack} disabled={currentStepIndex === 0} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}

        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild size="sm">
            <Link to={routeCDPipelineDetails.fullPath} params={{ clusterName, namespace, name: cdPipeline }}>
              Cancel
            </Link>
          </Button>

          {currentStepIndex < totalSteps - 1 ? (
            <Button onClick={handleContinue} size="sm" type="button">
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={isSubmitting} size="sm" type="submit">
              <Rocket className="mr-2 h-4 w-4" />
              Create Environment
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
