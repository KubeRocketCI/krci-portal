import { RequestError } from "@/core/types/global";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
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
          <div className={`flex flex-${orientation === "horizontal" ? "row" : "col"} gap-2 items-center justify-center`}>
            <TriangleAlert color="#A2A7B7" size={48} />
            <div className="flex gap-2 flex-row items-center">
              <span className="text-sm text-muted-foreground">
                Sorry. You don't have permissions to access this data.
              </span>
              <Link component={"button"} onClick={handleOpen} className="text-sm">
                More details
              </Link>
            </div>
          </div>
        );
      case 404:
        return (
          <div className={`flex flex-${orientation === "horizontal" ? "row" : "col"} gap-2 items-center justify-center`}>
            <SearchX color="#A2A7B7" size={48} />
            <div className="flex gap-2 flex-row items-center">
              <span className="text-sm text-muted-foreground">
                Sorry. The requested resource was not found.
              </span>
              <Link component={"button"} onClick={handleOpen} className="text-sm">
                More details
              </Link>
            </div>
          </div>
        );
      default:
        return "Oops! Something went wrong. Please try again later.";
    }
  }, [error?.data?.httpStatus, orientation, theme.typography]);

  return (
    <div
      className={outlined ? "w-full p-3" : "w-full"}
      style={
        outlined
          ? {
              borderTop: `1px solid ${theme.palette.action.selected}`,
              borderBottom: `1px solid ${theme.palette.action.selected}`,
            }
          : undefined
      }
    >
      <div>{renderError()}</div>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>More Details</DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-2">
            <p>{error?.message}</p>
            {extraInfoLink && (
              <div className="flex gap-2 flex-row items-center">
                <span>Additional information can be found</span>
                <Link href={extraInfoLink} target="_blank">
                  here
                </Link>
                .
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
