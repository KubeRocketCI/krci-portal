import { DialogProps } from "@/core/providers/Dialog/types";

export type PodExecDialogProps = DialogProps<{
  namespace: string;
  appName: string;
}>;
