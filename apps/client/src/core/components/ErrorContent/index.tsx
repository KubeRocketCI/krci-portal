import { RequestError } from "@/core/types/global";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { SearchX, TriangleAlert } from "lucide-react";
import React from "react";

export const ErrorContent = ({
  error,
  outlined,
  orientation = "horizontal",
  extraInfoLink,
}: {
  error: RequestError | null;
  outlined?: boolean;
  orientation?: "vertical" | "horizontal";
  extraInfoLink?: string;
}) => {
  const theme = useTheme();

  const [open, setOpen] = React.useState<boolean>(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const renderError = React.useCallback(() => {
    switch (error?.data?.httpStatus) {
      case 403:
        return (
          <Stack
            direction={orientation === "horizontal" ? "row" : "column"}
            spacing={1}
            alignItems="center"
            justifyContent="center"
          >
            <TriangleAlert color="#A2A7B7" size={48} />
            <Stack spacing={1} direction="row" alignItems="center">
              <Typography component="span" fontSize={theme.typography.pxToRem(14)} color="#596D80">
                Sorry. You don't have permissions to access this data.
              </Typography>
              <Link component={"button"} onClick={handleOpen} sx={{ fontSize: theme.typography.pxToRem(14) }}>
                More details
              </Link>
            </Stack>
          </Stack>
        );
      case 404:
        return (
          <Stack
            direction={orientation === "horizontal" ? "row" : "column"}
            spacing={1}
            alignItems="center"
            justifyContent="center"
          >
            <SearchX color="#A2A7B7" size={48} />
            <Stack spacing={1} direction="row" alignItems="center">
              <Typography component="span" fontSize={theme.typography.pxToRem(14)} color="#596D80">
                Sorry. The requested resource was not found.
              </Typography>
              <Link component={"button"} onClick={handleOpen} sx={{ fontSize: theme.typography.pxToRem(14) }}>
                More details
              </Link>
            </Stack>
          </Stack>
        );
      default:
        return "Oops! Something went wrong. Please try again later.";
    }
  }, [error?.data?.httpStatus, orientation, theme.typography]);

  return (
    <Box
      width="100%"
      sx={
        outlined
          ? {
              p: theme.typography.pxToRem(10),
              borderTop: `1px solid ${theme.palette.action.selected}`,
              borderBottom: `1px solid ${theme.palette.action.selected}`,
            }
          : null
      }
    >
      <Box>{renderError()}</Box>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>More Details</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <Typography>{error?.message}</Typography>
            {extraInfoLink && (
              <Stack spacing={1} direction="row" alignItems="center">
                <Typography>Additional information can be found</Typography>
                <Link href={extraInfoLink} target="_blank">
                  here
                </Link>
                .
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
