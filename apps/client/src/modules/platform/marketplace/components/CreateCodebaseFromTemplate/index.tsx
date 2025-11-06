import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import React from "react";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { FormDefaultValues } from "./components/FormDefaultValues";
import { Preview } from "./components/Preview";
import { DIALOG_NAME } from "./constants";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { CurrentDialogContextProvider } from "./providers/CurrentDialog/provider";
import { CreateCodebaseFromTemplateDialogProps } from "./types";
import { FormContextProvider } from "@/core/providers/Form/provider";

export const CreateCodebaseFromTemplateDialog: React.FC<CreateCodebaseFromTemplateDialogProps> = ({ props, state }) => {
  const { closeDialog, open } = state;
  const baseDefaultValues = useDefaultValues(props.template);
  const [value, setValue] = React.useState(0);

  const handleChange = (newValue: number) => {
    setValue(newValue);
  };

  const isPreviewPanel = value === 0;

  const isFormPanel = value === 1;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
      <DialogContent className="max-w-4xl w-full">
        <CurrentDialogContextProvider props={props} state={state}>
          <FormContextProvider
            formSettings={{
              defaultValues: baseDefaultValues,
              mode: "onBlur",
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-medium">Create application from template</DialogTitle>
            </DialogHeader>
            <DialogBody>
              {isPreviewPanel && <Preview />}

              {isFormPanel && (
                <div className="flex flex-col gap-2">
                  <FormDefaultValues />
                  <div>
                    <Form />
                  </div>
                </div>
              )}
            </DialogBody>
            <DialogFooter>
              {isPreviewPanel && (
                <div className="flex w-full justify-between gap-2">
                  <Button onClick={closeDialog} variant="ghost" size="sm">
                    Cancel
                  </Button>
                  <Button
                    type={"submit"}
                    variant={"default"}
                    size="sm"
                    onClick={() => handleChange(1)}
                  >
                    Proceed
                  </Button>
                </div>
              )}
              {isFormPanel && <FormActions />}
            </DialogFooter>
          </FormContextProvider>
        </CurrentDialogContextProvider>
      </DialogContent>
    </Dialog>
  );
};

CreateCodebaseFromTemplateDialog.displayName = DIALOG_NAME;
