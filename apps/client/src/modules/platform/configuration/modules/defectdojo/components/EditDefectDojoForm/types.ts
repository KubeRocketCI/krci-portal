import { Secret, QuickLink } from "@my-project/shared";

export interface EditDefectDojoFormProps {
  secret: Secret;
  quickLink: QuickLink | undefined;
  ownerReference: string | undefined;
  onClose: () => void;
}

export type { EditDefectDojoFormValues } from "./schema";
