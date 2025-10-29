import { Button, Dialog, DialogActions, DialogContent, DialogTitle, useTheme } from "@mui/material";
import React from "react";
import { DIALOG_NAME } from "./constants";
import { SuccessGraphDialogProps } from "./types";
import { Link } from "@tanstack/react-router";
import { PartyPopper } from "lucide-react";

export const SuccessDialog: React.FC<SuccessGraphDialogProps> = ({
  props: { dialogTitle, title, description, route },
  state: { closeDialog, open },
}) => {
  const theme = useTheme();

  return (
    <Dialog open={open} fullWidth onClose={() => closeDialog()} maxWidth={"sm"}>
      <DialogTitle>
        <h2 className="text-xl font-medium">
          {dialogTitle}
        </h2>
      </DialogTitle>
      <DialogContent>
        <div className="flex flex-col gap-2 items-center">
          <PartyPopper size={theme.typography.pxToRem(128)} color="#A2A7B7" />
          {title && (
            <h3 className="text-xl font-medium text-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => closeDialog()} color="primary">
          Close
        </Button>
        {route && (
          <Link
            to={route.to}
            params={route.params}
            search={route.search}
            onClick={() => closeDialog()}
            style={{ textDecoration: "none" }}
          >
            <Button color="primary" variant="contained">
              proceed
            </Button>
          </Link>
        )}
      </DialogActions>
    </Dialog>
  );
};

SuccessDialog.displayName = DIALOG_NAME;
