import { ValueOf } from "@/core/types/global";
import { QuickLink, Secret } from "@my-project/shared";
import { FORM_MODES } from "@/core/types/forms";
import { FORM_NAMES, INTEGRATION_SECRET_FORM_NAMES, QUICK_LINK_FORM_NAMES } from "./constants";

export type FormNames = ValueOf<typeof FORM_NAMES>;

export type QuickLinkFormValues = {
  [QUICK_LINK_FORM_NAMES.EXTERNAL_URL]: string;
};

export type IntegrationSecretFormValues = {
  [INTEGRATION_SECRET_FORM_NAMES.USERNAME]: string;
  [INTEGRATION_SECRET_FORM_NAMES.PASSWORD]: string;
  [INTEGRATION_SECRET_FORM_NAMES.URL]: string;
};

export interface ManageNexusCIProps {
  secret: Secret | undefined;
  quickLink: QuickLink | undefined;
  mode: ValueOf<typeof FORM_MODES>;
  ownerReference: string | undefined;
  handleClosePanel?: () => void;
}
