import { CLUSTER_FORM_NAMES } from "../../names";
import { clusterType } from "@my-project/shared";
import type { ManageClusterSecretValues } from "../../types";

// Default values for create mode
export const createDefaultValues: ManageClusterSecretValues = {
  [CLUSTER_FORM_NAMES.CLUSTER_TYPE]: clusterType.bearer,
  [CLUSTER_FORM_NAMES.CLUSTER_NAME]: "",
  [CLUSTER_FORM_NAMES.CLUSTER_HOST]: "",
  [CLUSTER_FORM_NAMES.CLUSTER_CERTIFICATE]: "",
  [CLUSTER_FORM_NAMES.CLUSTER_TOKEN]: "",
  [CLUSTER_FORM_NAMES.SKIP_TLS_VERIFY]: false,
  [CLUSTER_FORM_NAMES.ROLE_ARN]: "",
  [CLUSTER_FORM_NAMES.CA_DATA]: "",
};
