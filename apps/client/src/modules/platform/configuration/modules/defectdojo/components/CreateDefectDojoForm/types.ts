import { QuickLink } from "@my-project/shared";

export interface CreateDefectDojoFormProps {
  quickLink: QuickLink | undefined;
  onClose: () => void;
}

export type { CreateDefectDojoFormValues } from "./schema";
