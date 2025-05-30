import { K8sResourceConfig } from "@my-project/shared";
import { createLabelSelectorString } from "../createLabelSelectorString";

export const createCustomResourceURL = ({
  resourceConfig,
  namespace,
  labels,
}: {
  resourceConfig: K8sResourceConfig;
  namespace: string;
  labels?: Record<string, string>;
}): string => {
  const { group, version, pluralName } = resourceConfig;
  const labelSelectorString = createLabelSelectorString(labels);

  return labelSelectorString
    ? `/apis/${group}/${version}/namespaces/${namespace}/${pluralName}?labelSelector=${encodeURIComponent(labelSelectorString)}`
    : `/apis/${group}/${version}/namespaces/${namespace}/${pluralName}`;
};
