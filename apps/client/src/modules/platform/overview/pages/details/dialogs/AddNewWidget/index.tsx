import React from "react";
import { DialogInner } from "./components/DialogInner";
import { DIALOG_NAME } from "./constants";
import { CurrentDialogContextProvider } from "./providers/CurrentDialog/provider";
import { AddNewWidgetProps } from "./types";
import { StepperContextProvider } from "@/core/providers/Stepper/provider";

export const AddNewWidget: React.FC<AddNewWidgetProps> = ({ props, state }) => {
  return (
    <StepperContextProvider>
      <CurrentDialogContextProvider props={props} state={state}>
        <DialogInner />
      </CurrentDialogContextProvider>
    </StepperContextProvider>
  );
};

AddNewWidget.displayName = DIALOG_NAME;
