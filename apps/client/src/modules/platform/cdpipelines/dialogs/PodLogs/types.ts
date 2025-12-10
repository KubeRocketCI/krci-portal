import { DialogProps } from "@/core/providers/Dialog/types";

export type PodLogsDialogProps = DialogProps<{
  namespace: string;
  appName: string;
}>;
