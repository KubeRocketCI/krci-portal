import { ValueOf } from "@/core/types/global";
import { QuickLink, Secret, Codemie } from "@my-project/shared";
import { FORM_NAMES, CODEMIE_FORM_NAMES, CODEMIE_SECRET_FORM_NAMES, QUICK_LINK_FORM_NAMES } from "./constants";

export type FormNames = ValueOf<typeof FORM_NAMES>;

export type QuickLinkFormValues = {
  [QUICK_LINK_FORM_NAMES.EXTERNAL_URL]: string;
};

export type CodemieFormValues = {
  [CODEMIE_FORM_NAMES.TOKEN_ENDPOINT]: string;
  [CODEMIE_FORM_NAMES.API_URL]: string;
  [CODEMIE_FORM_NAMES.NAME]: string;
};

export type CodemieSecretFormValues = {
  [CODEMIE_SECRET_FORM_NAMES.CLIENT_ID]: string;
  [CODEMIE_SECRET_FORM_NAMES.CLIENT_SECRET]: string;
  [CODEMIE_SECRET_FORM_NAMES.NAME]: string;
};

export interface ManageCodeMieProps {
  quickLink: QuickLink | undefined;
  codemie: Codemie | undefined;
  codemieSecret: Secret | undefined;
  handleClosePanel?: () => void;
}
