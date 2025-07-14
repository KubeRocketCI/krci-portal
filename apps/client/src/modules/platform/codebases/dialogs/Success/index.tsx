import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, useTheme } from "@mui/material";
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
        <Typography fontSize={theme.typography.pxToRem(20)} fontWeight={500}>
          {dialogTitle}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1} alignItems="center">
          <PartyPopper size={theme.typography.pxToRem(128)} color="#A2A7B7" />
          {title && (
            <Typography color="primary.dark" fontSize={theme.typography.pxToRem(20)} fontWeight={500}>
              {title}
            </Typography>
          )}
          {description && (
            <Typography color="secondary.dark" fontSize={theme.typography.pxToRem(14)}>
              {description}
            </Typography>
          )}
        </Stack>
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
