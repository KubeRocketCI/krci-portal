import { K8sOperation } from "@my-project/shared";
import { DialogProps } from "../../../providers/Dialog/types";

export interface ResourceToUpdate {
  actionType: K8sOperation;
  kind: string;
  name: string;
}

export type ConfirmResourcesUpdatesDialogProps = DialogProps<{
  deleteCallback: () => void;
  text?: string;
  resourcesArray: ResourceToUpdate[];
}>;
