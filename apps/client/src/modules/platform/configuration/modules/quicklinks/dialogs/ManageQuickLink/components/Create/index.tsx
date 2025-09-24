import { DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { FormContextProvider } from "@/core/providers/Form/provider";
import { DialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";

export const Create = () => {
  const baseDefaultValues = useDefaultValues();

  return (
    <FormContextProvider
      formSettings={{
        mode: "onBlur",
        defaultValues: baseDefaultValues,
      }}
    >
      <DialogTitle>
        <DialogHeader />
      </DialogTitle>
      <DialogContent>
        <Form />
      </DialogContent>
      <DialogActions>
        <FormActions />
      </DialogActions>
    </FormContextProvider>
  );
};
