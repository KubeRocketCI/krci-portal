import { Secret, QuickLink } from "@my-project/shared";

export interface EditSonarFormProps {
  secret: Secret;
  quickLink: QuickLink | undefined;
  ownerReference: string | undefined;
  onClose: () => void;
}

export type { EditSonarFormValues } from "./schema";
