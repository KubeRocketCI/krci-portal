import { RouteParams } from "@/core/router/types";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { CheckCircle, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { SnackbarContent, SnackbarKey, useSnackbar } from "notistack";
import React, { ReactElement } from "react";

const SNACKBAR_VARIANT = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

export const Snackbar = React.forwardRef<
  HTMLDivElement,
  {
    snackbarKey: SnackbarKey;
    text: string;
    variant: string;
    route?: RouteParams;
    handleClose?: () => void;
  }
>((props, ref) => {
  const { text, variant, snackbarKey, route } = props;
  const { closeSnackbar } = useSnackbar();

  const theme = React.useMemo(() => {
    let icon: ReactElement = <Info size={20} color="#0094FF" />;
    let color: string = "#0094FF";

    switch (variant) {
      case SNACKBAR_VARIANT.SUCCESS:
        icon = <CheckCircle size={20} color="#18BE94" />;
        color = "#18BE94";
        break;
      case SNACKBAR_VARIANT.ERROR:
        icon = <XCircle size={20} color="#FD4C4D" />;
        color = "#FD4C4D";
        break;
      case SNACKBAR_VARIANT.WARNING:
        icon = <TriangleAlert size={20} color="#FFC754" />;
        color = "#FFC754";
        break;
      case SNACKBAR_VARIANT.INFO:
        icon = <Info size={20} color="#0094FF" />;
        color = "#0094FF";
        break;
      default:
        icon = <Info size={20} color="#0094FF" />;
        color = "#0094FF";
        break;
    }

    return {
      icon,
      color,
    };
  }, [variant]);

  const handleClose = () => {
    closeSnackbar(snackbarKey);
  };

  return (
    <SnackbarContent ref={ref} role={variant}>
      <Box
        sx={{
          minHeight: (t) => t.typography.pxToRem(30),
          borderRadius: (t) => t.typography.pxToRem(t.shape.borderRadius),
          padding: (t) => `${t.typography.pxToRem(6)} ${t.typography.pxToRem(16)}`,
          backgroundColor: theme.color,
          minWidth: (t) => t.typography.pxToRem(400),
          color: "white",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mr: "auto !important" }}>
            {theme.icon}
            <Typography variant="body2" color="white">
              {text}
            </Typography>
          </Stack>
          {route && (
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            <Button
              component={Link}
              size="small"
              variant="outlined"
              color="inherit"
              onClick={handleClose}
              to={route.to}
              params={route.params}
            >
              Go to page
            </Button>
          )}
          <IconButton size="small" onClick={handleClose}>
            <X size={20} color="white" />
          </IconButton>
        </Stack>
      </Box>
    </SnackbarContent>
  );
});
