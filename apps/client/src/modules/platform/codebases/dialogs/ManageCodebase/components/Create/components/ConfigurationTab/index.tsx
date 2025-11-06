import { DialogBody, DialogFooter, DialogHeader } from "@/core/components/ui/dialog";
import { StepperContextProvider } from "@/core/providers/Stepper/provider";
import { DialogHeader as ConfigurationDialogHeader } from "../Inner/components/DialogHeader";
import { FormActions as ConfigurationFooter } from "../Inner/components/FormActions";
import { Configuration } from "../Inner";
import { ConfigurationTabProps } from "./types";

export const ConfigurationTab = ({ baseDefaultValues, setActiveTab }: ConfigurationTabProps) => {
  return (
    <StepperContextProvider>
      <DialogHeader>
        <ConfigurationDialogHeader />
      </DialogHeader>
      <DialogBody>
        <Configuration />
      </DialogBody>
      <DialogFooter>
        <ConfigurationFooter baseDefaultValues={baseDefaultValues} setActiveTab={setActiveTab} />
      </DialogFooter>
    </StepperContextProvider>
  );
};

