import { GitServer, Secret } from "@my-project/shared";

export interface DeletionDialogProps {
  gitServer: GitServer | undefined;
  gitServerSecret: Secret | undefined;
  open: boolean;
  handleClose: () => void;
}
