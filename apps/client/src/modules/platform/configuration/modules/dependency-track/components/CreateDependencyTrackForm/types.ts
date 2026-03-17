import { QuickLink } from "@my-project/shared";

export interface CreateDependencyTrackFormProps {
  quickLink: QuickLink | undefined;
  onClose: () => void;
}

export type { CreateDependencyTrackFormValues } from "./schema";
