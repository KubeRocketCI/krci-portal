import { Dialog } from "@mui/material";
import React from "react";
import { Create } from "./components/Create";
import { Edit } from "./components/Edit";
import { dialogName } from "./constants";
import { CurrentDialogContextProvider } from "./providers/CurrentDialog/provider";
import { ManageCodebaseDialogProps } from "./types";
import { FORM_MODES } from "@/core/types/forms";

export const ManageCodebaseDialog: React.FC<ManageCodebaseDialogProps> = ({ props, state }) => {
  const { codebase } = props;

  const { open } = state;

  const mode = codebase ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  return (
    <Dialog open={open} maxWidth={"md"} fullWidth data-testid="dialog">
      <CurrentDialogContextProvider props={props} state={state}>
        {mode === FORM_MODES.CREATE ? <Create /> : mode === FORM_MODES.EDIT ? <Edit /> : null}
      </CurrentDialogContextProvider>
    </Dialog>
  );
};

ManageCodebaseDialog.displayName = dialogName;
