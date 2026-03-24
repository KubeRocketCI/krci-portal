import React from "react";
import { Check } from "lucide-react";
import { WIZARD_STEPS } from "../../store";
import { cn } from "@/core/utils/classname";
import { Card } from "@/core/components/ui/card";

interface WizardStepperProps {
  currentStepIdx: number;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({ currentStepIdx }) => {
  // Filter out SUCCESS step
  const navigableSteps = WIZARD_STEPS.filter((step) => step.id !== WIZARD_STEPS[WIZARD_STEPS.length - 1].id);

  return (
    <Card className="p-3 shadow-none">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          {navigableSteps.map((step, index) => {
            const isCompleted = currentStepIdx > step.id;
            const isCurrent = currentStepIdx === step.id;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      isCompleted && "border-primary bg-primary",
                      isCurrent && "border-primary bg-primary/10",
                      !isCompleted && !isCurrent && "border-border bg-background"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="text-primary-foreground h-5 w-5" />
                    ) : (
                      <Icon
                        className={cn("h-5 w-5", isCurrent && "text-primary", !isCurrent && "text-muted-foreground")}
                      />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        (isCurrent || isCompleted) && "text-foreground",
                        !isCurrent && !isCompleted && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="text-muted-foreground text-xs">{step.sublabel}</span>
                  </div>
                </div>

                {index < navigableSteps.length - 1 && (
                  <div className={cn("mx-3 h-0.5 w-12 transition-colors", isCompleted ? "bg-primary" : "bg-border")} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
