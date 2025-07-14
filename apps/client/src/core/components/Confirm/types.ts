import { DialogProps } from "@/core/providers/Dialog/types";

export type ConfirmDialogProps = DialogProps<{
  actionCallback: () => Promise<void>;
  text: string;
}>;
