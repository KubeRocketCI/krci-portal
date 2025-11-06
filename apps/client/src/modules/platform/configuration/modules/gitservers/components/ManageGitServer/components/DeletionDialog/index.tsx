import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { TableUI, TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI } from "@/core/components/ui/table";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import React from "react";
import { DeletionDialogProps } from "./types";
import { useGitServerCRUD } from "@/k8s/api/groups/KRCI/GitServer";
import { useSecretCRUD } from "@/k8s/api/groups/Core/Secret";

const CONFIRM_TEXT_VALUE = "confirm";

export const DeletionDialog = ({ gitServer, gitServerSecret, open, handleClose }: DeletionDialogProps) => {
  const [value, setValue] = React.useState("");

  const deletionDisabled = value !== CONFIRM_TEXT_VALUE;

  const { triggerDeleteGitServer } = useGitServerCRUD();

  const { triggerDeleteSecret } = useSecretCRUD();

  const handleDelete = React.useCallback(async () => {
    if (!gitServer) {
      return;
    }

    await triggerDeleteGitServer({
      data: { resource: gitServer },
      callbacks: {
        onSuccess: async () => {
          if (!gitServerSecret) {
            return;
          }

          await triggerDeleteSecret({ data: { resource: gitServerSecret } });
          setValue("");
        },
      },
    });
  }, [gitServer, gitServerSecret, triggerDeleteGitServer, triggerDeleteSecret]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete these?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="mb-5 rounded-md border">
            <TableUI>
              <TableHeaderUI>
                <TableRowUI>
                  <TableHeadUI>GitServer</TableHeadUI>
                  <TableHeadUI>Secret</TableHeadUI>
                </TableRowUI>
              </TableHeaderUI>
              <TableBodyUI>
                <TableRowUI>
                  <TableCellUI>{gitServer?.metadata.name}</TableCellUI>
                  <TableCellUI>{gitServerSecret?.metadata.name}</TableCellUI>
                </TableRowUI>
              </TableBodyUI>
            </TableUI>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-delete">{`Enter "${CONFIRM_TEXT_VALUE}" to start deletion`}</Label>
            <Input
              id="confirm-delete"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full"
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={handleClose} variant="ghost">Cancel</Button>
          <Button onClick={handleDelete} disabled={deletionDisabled} variant="default">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
