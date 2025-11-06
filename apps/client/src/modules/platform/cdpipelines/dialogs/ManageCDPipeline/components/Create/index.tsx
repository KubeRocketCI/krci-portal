import { DialogBody, DialogFooter, DialogHeader } from "@/core/components/ui/dialog";
import { DialogHeader as CustomDialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { FormContextProvider } from "@/core/providers/Form/provider";
import { StepperContextProvider } from "@/core/providers/Stepper/provider";
import { UnifiedStepper } from "./components/UnifiedStepper";

export const Create = () => {
  const baseDefaultValues = useDefaultValues();

  return (
    <FormContextProvider
      formSettings={{
        mode: "onBlur",
        defaultValues: baseDefaultValues,
      }}
    >
      <StepperContextProvider>
        <DialogHeader>
          <div className="flex w-full flex-col gap-4">
            <CustomDialogHeader />
            <UnifiedStepper />
          </div>
        </DialogHeader>
        <DialogBody>
          <Form />
        </DialogBody>
        <DialogFooter>
          <FormActions />
        </DialogFooter>
      </StepperContextProvider>
    </FormContextProvider>
  );
};
