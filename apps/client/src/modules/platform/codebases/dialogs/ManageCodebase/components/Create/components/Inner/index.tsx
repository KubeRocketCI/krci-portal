import EditorYAML from "@/core/components/EditorYAML";
import { useHandleEditorSave } from "@/core/hooks/useHandleEditorSave";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { useStepperContext } from "@/core/providers/Stepper/hooks";
import { getUsedValues } from "@/core/utils/forms/getUsedValues";
import { Box, DialogActions, DialogContent, DialogTitle, Step, StepLabel, Stepper, useTheme } from "@mui/material";
import React from "react";
import { configurationStepperSteps } from "../../../../constants";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { CODEBASE_BACKWARDS_NAME_MAPPING, CODEBASE_FORM_NAMES } from "../../../../names";
import { DialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useStyles } from "./styles";
import { ConfigurationProps } from "./types";
import { createCodebaseDraftObject } from "@my-project/shared";

export const Configuration = ({ baseDefaultValues, setActiveTab }: ConfigurationProps) => {
  const theme = useTheme();
  const { activeStep } = useStepperContext();
  const classes = useStyles();

  const { setDialog } = useDialogContext();
  const { getValues, setValue, resetField } = useTypedFormContext();

  const { handleEditorSave } = useHandleEditorSave({
    names: CODEBASE_FORM_NAMES,
    backwardNames: CODEBASE_BACKWARDS_NAME_MAPPING,
    setValue,
    resetField,
  });

  const handleOpenEditor = React.useCallback(() => {
    const formValues = getValues();

    const usedValues = getUsedValues(formValues, CODEBASE_FORM_NAMES);
    const newCodebaseData = createCodebaseDraftObject(CODEBASE_FORM_NAMES, usedValues);

    setDialog(EditorYAML, {
      content: newCodebaseData,
      onSave: (yaml, json) => {
        if (!json) {
          return;
        }

        handleEditorSave(json, usedValues);
      },
    });
  }, [getValues, handleEditorSave, setDialog]);

  return (
    <>
      <DialogTitle>
        <DialogHeader handleOpenEditor={handleOpenEditor} />
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <div className={classes.dialogContentForm}>
          <Box sx={{ pt: theme.typography.pxToRem(24) }}>
            <Stepper activeStep={activeStep}>
              {configurationStepperSteps.map((label) => {
                return (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                );
              })}
            </Stepper>
            <Box sx={{ p: `${theme.typography.pxToRem(24)} ${theme.typography.pxToRem(8)}` }}>
              <Form />
            </Box>
          </Box>
        </div>
      </DialogContent>
      <DialogActions>
        <FormActions baseDefaultValues={baseDefaultValues} setActiveTab={setActiveTab} />
      </DialogActions>
    </>
  );
};
