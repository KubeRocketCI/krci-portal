import type { DialogProps } from "@/core/providers/Dialog/types";

export type RollbackDialogProps = DialogProps<{
  namespace: string;
  name: string;
}>;
