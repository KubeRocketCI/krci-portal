import { DialogActions, DialogContent, DialogTitle } from "@mui/material";
import React from "react";
import { FormContextProvider } from "@/core/providers/Form/provider";
import { DialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { CodebaseBranchDraft } from "@my-project/shared";

export const Create = () => {
  const baseDefaultValues = useDefaultValues();

  const [, setEditorOpen] = React.useState<boolean>(false);
  const [, setEditorData] = React.useState<CodebaseBranchDraft>({} as CodebaseBranchDraft);

  return (
    <FormContextProvider
      formSettings={{
        mode: "onBlur",
        defaultValues: baseDefaultValues,
      }}
    >
      <DialogTitle>
        <DialogHeader setEditorData={setEditorData} setEditorOpen={setEditorOpen} />
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
