import type { Secret, QuickLink } from "@my-project/shared";

export type { EditArgoCDFormValues } from "./schema";

export interface EditArgoCDFormProps {
  secret: Secret;
  quickLink: QuickLink | undefined;
  ownerReference: string | undefined;
  onClose: () => void;
}
