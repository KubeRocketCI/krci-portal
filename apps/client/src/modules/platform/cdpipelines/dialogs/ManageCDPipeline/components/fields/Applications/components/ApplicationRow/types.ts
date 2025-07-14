import { Codebase } from "@my-project/shared";

export interface ApplicationRowProps {
  application: Codebase;
  index: number;
  removeRow: () => void;
}
