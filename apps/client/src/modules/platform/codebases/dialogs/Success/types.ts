import { DialogProps } from "@/core/providers/Dialog/types";
import { router } from "@/core/router";
import { LinkProps } from "@tanstack/react-router";

export type SuccessGraphDialogProps = DialogProps<{
  dialogTitle: string;
  title?: string;
  description?: string;
  link?: LinkProps<typeof router.routesById>;
}>;
