import { Button, Dialog, DialogActions, DialogContent, DialogTitle, useTheme } from "@mui/material";
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

  const theme = useTheme();

  return (
    <Dialog open={open} maxWidth={"md"} fullWidth data-testid="dialog">
      <CurrentDialogContextProvider props={props} state={state}>
        <FormContextProvider
          formSettings={{
            defaultValues: baseDefaultValues,
            mode: "onBlur",
          }}
        >
          <DialogTitle>
            <h2 className="text-xl font-medium">
              Create application from template
            </h2>
          </DialogTitle>

          <DialogContent>
            {isPreviewPanel && <Preview />}

            {isFormPanel && (
              <div className="flex flex-col gap-2">
                <FormDefaultValues />
                <div>
                  <Form />
                </div>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            {isPreviewPanel && (
              <div className="flex justify-between w-full gap-2">
                <Button onClick={closeDialog} size="small" component={"button"} color="inherit">
                  cancel
                </Button>
                <Button
                  type={"submit"}
                  variant={"contained"}
                  color={"primary"}
                  size="small"
                  onClick={() => handleChange(1)}
                >
                  proceed
                </Button>
              </div>
            )}
            {isFormPanel && <FormActions />}
          </DialogActions>
        </FormContextProvider>
      </CurrentDialogContextProvider>
    </Dialog>
  );
};

CreateCodebaseFromTemplateDialog.displayName = DIALOG_NAME;
