import { cn } from "@/core/utils/classname";
import React from "react";
import { EDIT_WIZARD_STEPS } from "../../store";

interface WizardStepperProps {
  currentStepIdx: number;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({ currentStepIdx }) => {
  return (
    <div className="flex items-center justify-center gap-4">
      {EDIT_WIZARD_STEPS.map((step, index) => {
        const isActive = step.id === currentStepIdx;
        const isCompleted = step.id < currentStepIdx;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.id}>
            {index > 0 && (
              <div className={cn("h-px w-12 shrink-0", isCompleted ? "bg-primary" : "bg-border")} aria-hidden="true" />
            )}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isActive && "border-primary bg-primary/10",
                  isCompleted && "border-primary bg-primary",
                  !isActive && !isCompleted && "border-border bg-muted"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive && "text-primary",
                    isCompleted && "text-primary-foreground",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                />
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive && "text-foreground",
                    !isActive && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                <span className="text-muted-foreground text-xs">{step.sublabel}</span>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
