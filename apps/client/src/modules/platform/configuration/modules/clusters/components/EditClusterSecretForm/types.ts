import { FormMode } from "@/core/types/forms";
import { Secret } from "@my-project/shared";
import { ClusterType } from "@my-project/shared";
import { CLUSTER_FORM_NAMES } from "./constants";

export { CLUSTER_FORM_NAMES } from "./constants";

export interface ManageClusterSecretDataContext {
  handleClosePlaceholder?: () => void;
  mode: FormMode;
  currentElement?: Secret;
  ownerReference: string | undefined;
}

export interface ManageClusterSecretProps {
  formData: ManageClusterSecretDataContext;
}

export type ManageClusterSecretValues = {
  [CLUSTER_FORM_NAMES.CLUSTER_TYPE]: ClusterType;
  [CLUSTER_FORM_NAMES.CLUSTER_NAME]: string;
  [CLUSTER_FORM_NAMES.CLUSTER_HOST]: string;
  [CLUSTER_FORM_NAMES.CLUSTER_CERTIFICATE]: string;
  [CLUSTER_FORM_NAMES.CLUSTER_TOKEN]: string;
  [CLUSTER_FORM_NAMES.SKIP_TLS_VERIFY]: boolean;
  [CLUSTER_FORM_NAMES.ROLE_ARN]: string;
  [CLUSTER_FORM_NAMES.CA_DATA]: string;
};
