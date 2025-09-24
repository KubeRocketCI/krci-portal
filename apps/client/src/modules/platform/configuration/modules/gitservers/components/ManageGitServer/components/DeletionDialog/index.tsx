import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
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
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Are you sure you want to delete these?</DialogTitle>
      <DialogContent sx={{ pt: "20px !important" }}>
        <Table sx={{ mb: (t) => t.typography.pxToRem(20) }}>
          <TableHead>
            <TableRow>
              <TableCell>GitServer</TableCell>
              <TableCell>Secret</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{gitServer?.metadata.name}</TableCell>
              <TableCell>{gitServerSecret?.metadata.name}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <TextField
          label={`Enter "${CONFIRM_TEXT_VALUE}" to start deletion`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          variant="outlined"
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleDelete} disabled={deletionDisabled} color="primary">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
