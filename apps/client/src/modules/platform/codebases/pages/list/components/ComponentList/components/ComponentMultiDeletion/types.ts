import { Codebase } from "@my-project/shared";

export interface ComponentMultiDeletionProps {
  components: Codebase[];
  selected: string[];
  open: boolean;
  handleClose: () => void;
  onDelete: () => void;
}
