import { Dialog, DialogContent, DialogTitle } from "@/core/components/ui/dialog";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";

interface DialogLoadingShellProps {
  onClose: () => void;
}

/** Shown while a lazy dialog's chunk loads. Dismissable like the dialog it stands in for. */
export function DialogLoadingShell({ onClose }: DialogLoadingShellProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[40vh] w-full max-w-xl items-center justify-center">
        <DialogTitle className="sr-only">Loading</DialogTitle>
        <LoadingSpinner />
      </DialogContent>
    </Dialog>
  );
}
