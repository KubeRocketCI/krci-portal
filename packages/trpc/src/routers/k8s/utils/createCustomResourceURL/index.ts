import { K8sResourceConfig } from "@my-project/shared";
import { CLUSTER_SCOPED_CORE_RESOURCES, isCoreKubernetesResource } from "../../constants/index.js";
import { createLabelSelectorString } from "../createLabelSelectorString/index.js";

export const createCustomResourceURL = ({
  resourceConfig,
  namespace,
  labels,
  name,
}: {
  resourceConfig: K8sResourceConfig;
  namespace?: string;
  labels?: Record<string, string>;
  name?: string;
}): string => {
  const { pluralName, kind } = resourceConfig;
  const labelSelectorString = createLabelSelectorString(labels);

  const isNamespaced =
    !resourceConfig.clusterScoped && !CLUSTER_SCOPED_CORE_RESOURCES.has(kind) && kind !== "Namespace";

  // Extract version from either version field or apiVersion field
  const version = resourceConfig.version || resourceConfig.apiVersion?.split("/").pop() || "v1";

  let basePath: string;
  let resourcePath: string;

  if (isCoreKubernetesResource(resourceConfig)) {
    basePath = `/api/${version}`;

    if (isNamespaced && namespace) {
      resourcePath = `namespaces/${namespace}/${pluralName}`;
    } else {
      resourcePath = pluralName;
    }
  } else {
    // Handle empty group case to avoid double slashes
    if (resourceConfig.group) {
      basePath = `/apis/${resourceConfig.group}/${version}`;
    } else {
      basePath = `/apis/${version}`;
    }

    if (isNamespaced && namespace) {
      resourcePath = `namespaces/${namespace}/${pluralName}`;
    } else {
      resourcePath = pluralName;
    }
  }

  // Build the complete path and clean up any double slashes
  let path = `${basePath}/${resourcePath}`.replace(/\/+/g, "/");

  // Add specific resource name if provided
  if (name) {
    path += `/${name}`;
  }

  return labelSelectorString ? `${path}?labelSelector=${encodeURIComponent(labelSelectorString)}` : path;
};
