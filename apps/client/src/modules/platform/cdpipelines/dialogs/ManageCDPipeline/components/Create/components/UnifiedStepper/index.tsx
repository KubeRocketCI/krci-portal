import { useStepperContext } from "@/core/providers/Stepper/hooks";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/core/components/ui/stepper";
import { Check } from "lucide-react";
import { FORM_STEPPER_STEPS } from "../../../../constants";

export const UnifiedStepper = () => {
  const { activeStep } = useStepperContext();

  return (
    <Stepper
      value={activeStep + 1}
      indicators={{
        completed: <Check className="size-4" />,
      }}
      className="w-full"
    >
      <StepperNav>
        {FORM_STEPPER_STEPS.map((label, index) => (
          <StepperItem key={label} step={index + 1} completed={index < activeStep} className="relative">
            <StepperTrigger asChild className="flex justify-start gap-1.5">
              <div className="flex items-center gap-1.5">
                <StepperIndicator>{index + 1}</StepperIndicator>
                <StepperTitle className="text-sm">{label}</StepperTitle>
              </div>
            </StepperTrigger>
            {FORM_STEPPER_STEPS.length > index + 1 && <StepperSeparator className="md:mx-2.5" />}
          </StepperItem>
        ))}
      </StepperNav>
    </Stepper>
  );
};
