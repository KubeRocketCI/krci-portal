import { RequestError } from "@/core/types/global";
import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
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
          <div
            className={`flex flex-${orientation === "horizontal" ? "row" : "col"} items-center justify-center gap-2`}
          >
            <TriangleAlert color="#A2A7B7" size={48} />
            <div className="flex flex-row items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Sorry. You don't have permissions to access this data.
              </span>
              <Button variant="link" onClick={handleOpen} className="h-auto p-0 text-sm">
                More details
              </Button>
            </div>
          </div>
        );
      case 404:
        return (
          <div
            className={`flex flex-${orientation === "horizontal" ? "row" : "col"} items-center justify-center gap-2`}
          >
            <SearchX color="#A2A7B7" size={48} />
            <div className="flex flex-row items-center gap-2">
              <span className="text-muted-foreground text-sm">Sorry. The requested resource was not found.</span>
              <Button variant="link" onClick={handleOpen} className="h-auto p-0 text-sm">
                More details
              </Button>
            </div>
          </div>
        );
      default:
        return "Oops! Something went wrong. Please try again later.";
    }
  }, [error?.data?.httpStatus, orientation]);

  return (
    <div className={outlined ? "border-border w-full border-t border-b p-3" : "w-full"}>
      <div>{renderError()}</div>
      <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>More Details</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-2">
              <p>{error?.message}</p>
              {extraInfoLink && (
                <div className="flex flex-row items-center gap-2">
                  <span>Additional information can be found</span>
                  <a
                    href={extraInfoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    here
                  </a>
                  .
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
