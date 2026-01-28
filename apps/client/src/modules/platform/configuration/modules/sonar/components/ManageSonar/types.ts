import { ValueOf } from "@/core/types/global";
import { QuickLink, Secret } from "@my-project/shared";
import { FORM_MODES } from "@/core/types/forms";
export { NAMES } from "./constants";

export interface ManageSonarCIProps {
  secret: Secret | undefined;
  quickLink: QuickLink | undefined;
  mode: ValueOf<typeof FORM_MODES>;
  ownerReference: string | undefined;
  handleClosePanel?: () => void;
}

export type { ManageSonarFormValues } from "./names";
