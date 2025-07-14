import { DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { FormContextProvider } from "@/core/providers/Form/provider";
import { StepperContextProvider } from "@/core/providers/Stepper/provider";
import { DialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";

export const Create = () => {
  const defaultValues = useDefaultValues();

  return (
    <FormContextProvider
      formSettings={{
        mode: "onBlur",
        defaultValues: defaultValues,
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
