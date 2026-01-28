import { ConfigMap, ContainerRegistryType, Secret, ServiceAccount } from "@my-project/shared";
import { ValueOf } from "@my-project/shared";
import {
  CONFIG_MAP_FORM_NAMES,
  FORM_NAMES,
  PULL_ACCOUNT_FORM_NAMES,
  PUSH_ACCOUNT_FORM_NAMES,
  SERVICE_ACCOUNT_FORM_NAMES,
  SHARED_FORM_NAMES,
} from "./constants";

export {
  CONFIG_MAP_FORM_NAMES,
  FORM_NAMES,
  PULL_ACCOUNT_FORM_NAMES,
  PUSH_ACCOUNT_FORM_NAMES,
  SERVICE_ACCOUNT_FORM_NAMES,
  SHARED_FORM_NAMES,
} from "./constants";

export type FormNames = Exclude<ValueOf<typeof FORM_NAMES>, typeof FORM_NAMES.SHARED>;

export interface ManageRegistryProps {
  EDPConfigMap: ConfigMap | undefined;
  pushAccountSecret: Secret | undefined;
  pullAccountSecret: Secret | undefined;
  tektonServiceAccount: ServiceAccount | undefined;
  handleCloseCreateDialog?: () => void;
}

export type SharedFormValues = {
  [SHARED_FORM_NAMES.REGISTRY_TYPE]: ContainerRegistryType;
  [SHARED_FORM_NAMES.REGISTRY_ENDPOINT]: string;
  [SHARED_FORM_NAMES.USE_SAME_ACCOUNT]: boolean;
};

export type ConfigMapFormValues = {
  [CONFIG_MAP_FORM_NAMES.REGISTRY_TYPE]: ContainerRegistryType;
  [CONFIG_MAP_FORM_NAMES.REGISTRY_ENDPOINT]: string;
  [CONFIG_MAP_FORM_NAMES.REGISTRY_SPACE]: string;
  [CONFIG_MAP_FORM_NAMES.AWS_REGION]?: string;
};

export type ServiceAccountFormValues = {
  [SERVICE_ACCOUNT_FORM_NAMES.IRSA_ROLE_ARN]: string;
};

export type PushAccountFormValues = {
  [PUSH_ACCOUNT_FORM_NAMES.PUSH_ACCOUNT_USER]: string;
  [PUSH_ACCOUNT_FORM_NAMES.PUSH_ACCOUNT_PASSWORD]: string;
};

export type PullAccountFormValues = {
  [PULL_ACCOUNT_FORM_NAMES.PULL_ACCOUNT_USER]: string;
  [PULL_ACCOUNT_FORM_NAMES.PULL_ACCOUNT_PASSWORD]: string;
};
