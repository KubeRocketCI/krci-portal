import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Step, StepLabel, Stepper } from "@mui/material";
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
    <Dialog open={open} maxWidth={"sm"} fullWidth data-testid="dialog">
      <DialogTitle>Add New Widget</DialogTitle>
      <DialogContent>
        <div className="mt-6 flex flex-col gap-4">
          <Stepper activeStep={activeStep}>
            {STEPPER_STEPS.map((label) => {
              return (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              );
            })}
          </Stepper>
          <div>
            {activeStep === STEPPER.SELECTION.idx && <Selection form={form} />}
            {activeStep === STEPPER.CONFIGURATION.idx && (
              <Configuration widgetType={widgetType as WidgetType} addButtonContainerRef={addButtonContainerRef} />
            )}
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <div className="flex w-full flex-row items-center justify-between gap-4">
          <Button onClick={closeDialog}>cancel</Button>
          <div className="flex flex-row gap-4">
            {activeStep === STEPPER.SELECTION.idx && (
              <Button disabled={!widgetType} onClick={nextStep}>
                next
              </Button>
            )}
            {activeStep === STEPPER.CONFIGURATION.idx && (
              <>
                <Button onClick={prevStep}>back</Button>
                <div ref={addButtonContainerRef} />
              </>
            )}
          </div>
        </div>
      </DialogActions>
    </Dialog>
  );
};
