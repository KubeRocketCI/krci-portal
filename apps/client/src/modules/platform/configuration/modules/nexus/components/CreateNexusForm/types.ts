import type { QuickLink } from "@my-project/shared";

export type { CreateNexusFormValues } from "./schema";

export interface CreateNexusFormProps {
  quickLink: QuickLink | undefined;
  onClose: () => void;
}
