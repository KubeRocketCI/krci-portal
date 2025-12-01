import React from "react";
import { Card } from "@/core/components/ui/card";
import { Check } from "lucide-react";
import { WIZARD_STEPS } from "../../store";

interface WizardStepperProps {
  currentStepIdx: number;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({ currentStepIdx }) => {
  return (
    <Card className="p-3 shadow-none">
      <div className="flex items-center gap-4">
        {WIZARD_STEPS.slice(0, -1).map((step) => {
          const Icon = step.icon;
          const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === step.id);
          const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStepIdx);
          const isActive = step.id === currentStepIdx;
          const isCompleted = currentStepIndex > stepIndex;

          return (
            <div key={step.id} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isCompleted
                    ? "bg-primary text-white"
                    : isActive
                      ? "bg-accent text-primary"
                      : "bg-border text-secondary-foreground"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-xs ${isActive ? "text-primary" : "text-foreground"}`}>{step.label}</div>
                <div className="text-muted-foreground text-xs">{step.sublabel}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

