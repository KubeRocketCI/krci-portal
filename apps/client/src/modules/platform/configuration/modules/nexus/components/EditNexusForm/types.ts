import type { Secret, QuickLink } from "@my-project/shared";

export type { EditNexusFormValues } from "./schema";

export interface EditNexusFormProps {
  secret: Secret;
  quickLink: QuickLink | undefined;
  ownerReference: string | undefined;
  onClose: () => void;
}
