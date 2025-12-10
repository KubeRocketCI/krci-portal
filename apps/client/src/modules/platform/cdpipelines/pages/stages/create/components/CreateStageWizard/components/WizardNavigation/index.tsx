import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { useClusterStore } from "@/k8s/store";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Rocket } from "lucide-react";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useShallow } from "zustand/react/shallow";
import { routeStageCreate } from "../../../../route";
import { CREATE_FORM_PARTS, CreateStageFormValues } from "../../names";
import { NAVIGABLE_STEP_IDXS, useWizardStore } from "../../store";
import { routeCDPipelineDetails } from "@/modules/platform/cdpipelines/pages/details/route";

interface WizardNavigationProps {
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false,
}) => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const { namespace, cdPipeline } = routeStageCreate.useParams();

  const { currentStepIdx, getCurrentFormPart } = useWizardStore(
    useShallow((state) => ({
      currentStepIdx: state.currentStepIdx,
      getCurrentFormPart: state.getCurrentFormPart,
    }))
  );

  const currentFormPart = getCurrentFormPart();
  const currentStepIndex = NAVIGABLE_STEP_IDXS.indexOf(currentStepIdx);
  const totalSteps = NAVIGABLE_STEP_IDXS.length;

  const { trigger } = useFormContext<CreateStageFormValues>();

  const handleContinue = React.useCallback(async () => {
    if (currentFormPart) {
      const stepFields = CREATE_FORM_PARTS[currentFormPart];
      if (stepFields) {
        const hasNoErrors = await trigger(stepFields);

        if (hasNoErrors) {
          onNext();
        }
      } else {
        onNext();
      }
    } else {
      // For steps without form fields (like REVIEW), just proceed
      onNext();
    }
  }, [currentFormPart, onNext, trigger]);

  return (
    <Card className="p-3 shadow-none">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} disabled={currentStepIndex === 0} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild size="sm">
            <Link to={routeCDPipelineDetails.fullPath} params={{ clusterName, namespace, name: cdPipeline }}>
              Cancel
            </Link>
          </Button>

          {currentStepIndex < totalSteps - 1 ? (
            <Button onClick={handleContinue} size="sm">
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                onSubmit();
              }}
              disabled={isSubmitting}
              size="sm"
              type="button"
            >
              <Rocket className="mr-2 h-4 w-4" />
              Create Environment
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
