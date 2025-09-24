import { Dialog } from "@mui/material";
import React from "react";
import { Create } from "./components/Create";
import { Edit } from "./components/Edit";
import { DIALOG_NAME } from "./constants";
import { CurrentDialogContextProvider } from "./providers/CurrentDialog/provider";
import { ManageQuickLinkDialogProps } from "./types";
import { FORM_MODES } from "@/core/types/forms";

export const ManageQuickLinkDialog: React.FC<ManageQuickLinkDialogProps> = (props) => {
  const {
    props: { quickLink },
    state: { open },
  } = props;

  const mode = quickLink ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  return (
    <Dialog open={open} maxWidth={"md"} fullWidth data-testid="dialog">
      <CurrentDialogContextProvider {...props}>
        {mode === FORM_MODES.CREATE ? <Create /> : mode === FORM_MODES.EDIT ? <Edit /> : null}
      </CurrentDialogContextProvider>
    </Dialog>
  );
};

ManageQuickLinkDialog.displayName = DIALOG_NAME;
