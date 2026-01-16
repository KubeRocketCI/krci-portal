import { useState } from "react";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/core/components/ui/stepper";
import { BookUser, Check, CreditCard, ListTodo, LoaderCircleIcon, LockKeyhole } from "lucide-react";

const steps = [
  { title: "User Details", icon: BookUser },
  { title: "Payment Info", icon: CreditCard },
  { title: "Auth OTP", icon: LockKeyhole },
  { title: "Preview Form", icon: ListTodo },
];

export default function Component() {
  const [currentStep, setCurrentStep] = useState(2);

  return (
    <Stepper
      value={currentStep}
      onValueChange={setCurrentStep}
      indicators={{
        completed: <Check className="size-4" />,
        loading: <LoaderCircleIcon className="size-4 animate-spin" />,
      }}
      className="space-y-8"
    >
      <StepperNav className="mb-15 gap-3">
        {steps.map((step, index) => {
          return (
            <StepperItem key={index} step={index + 1} className="relative flex-1 items-start">
              <StepperTrigger className="flex grow flex-col items-start justify-center gap-2.5" asChild>
                <StepperIndicator className="data-[state=inactive]:border-border data-[state=inactive]:text-muted-foreground size-8 border-2 data-[state=completed]:bg-green-500 data-[state=completed]:text-white data-[state=inactive]:bg-transparent">
                  <step.icon className="size-4" />
                </StepperIndicator>
                <div className="flex flex-col items-start gap-1">
                  <div className="text-muted-foreground text-[10px] font-semibold uppercase">Step {index + 1}</div>
                  <StepperTitle className="group-data-[state=inactive]/step:text-muted-foreground text-start text-base font-semibold">
                    {step.title}
                  </StepperTitle>
                  <div>
                    <Badge variant="default" className="hidden group-data-[state=active]/step:inline-flex">
                      In Progress
                    </Badge>

                    <Badge variant="secondary" className="hidden group-data-[state=completed]/step:inline-flex">
                      Completed
                    </Badge>

                    <Badge
                      variant="secondary"
                      className="text-muted-foreground hidden group-data-[state=inactive]/step:inline-flex"
                    >
                      Pending
                    </Badge>
                  </div>
                </div>
              </StepperTrigger>

              {steps.length > index + 1 && (
                <StepperSeparator className="absolute inset-x-0 start-9 top-4 m-0 group-data-[orientation=horizontal]/stepper-nav:w-[calc(100%-2rem)] group-data-[orientation=horizontal]/stepper-nav:flex-none group-data-[state=completed]/step:bg-green-500" />
              )}
            </StepperItem>
          );
        })}
      </StepperNav>

      <StepperPanel className="text-sm">
        {steps.map((step, index) => (
          <StepperContent key={index} value={index + 1} className="flex items-center justify-center">
            Step {step.title} content
          </StepperContent>
        ))}
      </StepperPanel>

      <div className="flex items-center justify-between gap-2.5">
        <Button variant="outline" onClick={() => setCurrentStep((prev) => prev - 1)} disabled={currentStep === 1}>
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => prev + 1)}
          disabled={currentStep === steps.length}
        >
          Next
        </Button>
      </div>
    </Stepper>
  );
}
