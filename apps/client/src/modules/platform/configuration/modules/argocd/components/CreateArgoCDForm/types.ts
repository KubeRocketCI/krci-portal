import type { QuickLink } from "@my-project/shared";

export type { CreateArgoCDFormValues } from "./schema";

export interface CreateArgoCDFormProps {
  quickLink: QuickLink | undefined;
  onClose: () => void;
}
