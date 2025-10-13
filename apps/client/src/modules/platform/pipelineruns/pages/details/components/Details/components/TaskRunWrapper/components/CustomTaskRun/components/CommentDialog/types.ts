import { DialogProps } from "@/core/providers/Dialog/types";

export type CommentDialogProps = DialogProps<{
  onFormSubmit: (comment: string) => void;
  title: string;
}>;
