import { DialogProps } from "@/core/providers/Dialog/types";

export type CreateResourceDialogProps = DialogProps<Record<string, never>>;

export type ApplyResult = {
  success: boolean;
  kind?: string;
  name?: string;
  error?: string;
};
