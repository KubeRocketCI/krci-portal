import React from "react";
import { CLUSTER_FORM_NAMES } from "../../../names";
import { ManageClusterSecretDataContext } from "../../../types";
import {
  parseConfigJson,
  safeDecode,
  getClusterName,
  SECRET_LABEL_CLUSTER_TYPE,
  clusterType,
} from "@my-project/shared";

export const useDefaultValues = ({ formData }: { formData: ManageClusterSecretDataContext }) => {
  const { currentElement } = formData;

  const isPlaceholder = typeof currentElement === "string" && currentElement === "placeholder";

  return React.useMemo(() => {
    if (isPlaceholder || !currentElement) {
      return {};
    }

    const _clusterType = currentElement.metadata?.labels?.[SECRET_LABEL_CLUSTER_TYPE] ?? clusterType.bearer;

    const clusterName = getClusterName(currentElement);

    if (_clusterType === clusterType.bearer) {
      const config = parseConfigJson(currentElement.data?.config || "");

      return {
        [CLUSTER_FORM_NAMES.CLUSTER_TYPE]: clusterType.bearer,
        [CLUSTER_FORM_NAMES.CLUSTER_NAME]: clusterName,
        [CLUSTER_FORM_NAMES.CLUSTER_HOST]: config?.clusters[0]?.cluster?.server,
        [CLUSTER_FORM_NAMES.CLUSTER_CERTIFICATE]: config?.clusters[0]?.cluster?.["certificate-authority-data"],
        [CLUSTER_FORM_NAMES.SKIP_TLS_VERIFY]: config?.clusters[0]?.cluster?.["insecure-skip-tls-verify"],
        [CLUSTER_FORM_NAMES.CLUSTER_TOKEN]: config?.users[0]?.user?.token,
      };
    } else {
      const parsedData = parseConfigJson(currentElement.data?.config || "");

      return {
        [CLUSTER_FORM_NAMES.CLUSTER_TYPE]: clusterType.irsa,
        [CLUSTER_FORM_NAMES.CLUSTER_NAME]: clusterName,
        [CLUSTER_FORM_NAMES.CLUSTER_HOST]: safeDecode(currentElement.data?.server || ""),
        [CLUSTER_FORM_NAMES.ROLE_ARN]: parsedData?.awsAuthConfig?.roleARN,
        [CLUSTER_FORM_NAMES.CA_DATA]: parsedData?.tlsClientConfig?.caData,
      };
    }
  }, [currentElement, isPlaceholder]);
};
