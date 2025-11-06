import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
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
import { Check } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { STEPPER, STEPPER_STEPS } from "../../constants";
import { useCurrentDialog } from "../../providers/CurrentDialog/hooks";
import { WidgetType } from "../../types";
import { Configuration } from "./Configuration";
import { Selection } from "./Selection";
import { useStepperContext } from "@/core/providers/Stepper/hooks";

export const DialogInner = () => {
  const { activeStep, nextStep, prevStep } = useStepperContext();
  const {
    state: { open, closeDialog },
  } = useCurrentDialog();

  const form = useForm<Record<"widgetType", string>>({
    defaultValues: {
      widgetType: undefined,
    },
  });

  const widgetType = form.watch("widgetType");

  const addButtonContainerRef = React.useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
      <DialogContent className="w-full max-w-2xl">
        <Stepper
          value={activeStep + 1}
          indicators={{
            completed: <Check className="size-4" />,
          }}
          className="w-full"
        >
          <DialogHeader>
            <div className="flex w-full flex-col gap-4">
              <DialogTitle>Add New Widget</DialogTitle>
              <StepperNav>
                {STEPPER_STEPS.map((label, index) => (
                  <StepperItem key={label} step={index + 1} completed={index < activeStep} className="relative">
                    <StepperTrigger asChild className="flex justify-start gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <StepperIndicator>{index + 1}</StepperIndicator>
                        <StepperTitle className="text-sm">{label}</StepperTitle>
                      </div>
                    </StepperTrigger>
                    {STEPPER_STEPS.length > index + 1 && <StepperSeparator className="md:mx-2.5" />}
                  </StepperItem>
                ))}
              </StepperNav>
            </div>
          </DialogHeader>
          <DialogBody>
            <StepperPanel>
              <StepperContent value={STEPPER.SELECTION.idx + 1}>
                <Selection form={form} />
              </StepperContent>
              <StepperContent value={STEPPER.CONFIGURATION.idx + 1}>
                <Configuration widgetType={widgetType as WidgetType} addButtonContainerRef={addButtonContainerRef} />
              </StepperContent>
            </StepperPanel>
          </DialogBody>
          <DialogFooter>
            <div className="flex w-full flex-row items-center justify-between gap-4">
              <Button onClick={closeDialog} variant="ghost">
                Cancel
              </Button>
              <div className="flex flex-row gap-4">
                {activeStep === STEPPER.SELECTION.idx && (
                  <Button disabled={!widgetType} onClick={nextStep}>
                    Next
                  </Button>
                )}
                {activeStep === STEPPER.CONFIGURATION.idx && (
                  <>
                    <Button onClick={prevStep} variant="ghost">
                      Back
                    </Button>
                    <div ref={addButtonContainerRef} />
                  </>
                )}
              </div>
            </div>
          </DialogFooter>
        </Stepper>
      </DialogContent>
    </Dialog>
  );
};
