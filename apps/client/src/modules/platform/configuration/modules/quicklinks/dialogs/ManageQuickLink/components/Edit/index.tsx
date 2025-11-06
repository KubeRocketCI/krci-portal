import { DialogBody, DialogFooter, DialogHeader } from "@/core/components/ui/dialog";
import { FormContextProvider } from "@/core/providers/Form/provider";
import { DialogHeader as CustomDialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";

export const Edit = () => {
  const baseDefaultValues = useDefaultValues();

  return (
    <FormContextProvider
      formSettings={{
        mode: "onBlur",
        defaultValues: baseDefaultValues,
      }}
    >
      <DialogHeader>
        <CustomDialogHeader />
      </DialogHeader>
      <DialogBody>
        <Form />
      </DialogBody>
      <DialogFooter>
        <FormActions />
      </DialogFooter>
    </FormContextProvider>
  );
};
