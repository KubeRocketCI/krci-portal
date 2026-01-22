import { DialogProps } from "@/core/providers/Dialog/types";
import { Codebase } from "@my-project/shared";

export type EditCodebaseDialogProps = DialogProps<{
  codebase: Codebase;
  isProtected?: boolean;
}>;
