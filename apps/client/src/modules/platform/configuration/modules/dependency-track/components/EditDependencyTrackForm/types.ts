import { Secret, QuickLink } from "@my-project/shared";

export interface EditDependencyTrackFormProps {
  secret: Secret;
  quickLink: QuickLink | undefined;
  ownerReference: string | undefined;
  onClose: () => void;
}

export type { EditDependencyTrackFormValues } from "./schema";
