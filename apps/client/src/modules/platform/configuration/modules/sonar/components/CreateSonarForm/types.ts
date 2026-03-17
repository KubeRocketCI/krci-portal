import type { QuickLink } from "@my-project/shared";

export interface CreateSonarFormProps {
  quickLink: QuickLink | undefined;
  onClose: () => void;
}

export type { CreateSonarFormValues } from "./schema";
