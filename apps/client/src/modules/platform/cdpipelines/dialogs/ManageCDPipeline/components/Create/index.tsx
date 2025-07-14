import { DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { DialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { FormContextProvider } from "@/core/providers/Form/provider";
import { StepperContextProvider } from "@/core/providers/Stepper/provider";

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
        <DialogTitle>
          <DialogHeader />
        </DialogTitle>
        <DialogContent>
          <Form />
        </DialogContent>
        <DialogActions>
          <FormActions />
        </DialogActions>
      </StepperContextProvider>
    </FormContextProvider>
  );
};
