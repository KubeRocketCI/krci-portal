import { DialogProps } from "@/core/providers/Dialog/types";
import { RouteParams } from "@/core/router/types";

export type SuccessGraphDialogProps = DialogProps<{
  dialogTitle: string;
  title?: string;
  description?: string;
  route?: RouteParams;
}>;
