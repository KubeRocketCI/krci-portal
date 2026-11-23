import { K8sApiError, type K8sResourceConfig } from "@my-project/shared";
import type { CodebaseKubeReader } from "../codebaseFindings/facts.js";

/** A Kubernetes object as the API server returns it: only what the codebase findings read. */
export interface KubeObject {
  kind: string;
  metadata: { name: string; namespace: string; labels?: Record<string, string> };
  spec: Record<string, unknown>;
}

function matchesSelector(object: KubeObject, labelSelector: string | undefined): boolean {
  if (!labelSelector) {
    return true;
  }
  return labelSelector.split(",").every((requirement) => {
    const [key, value] = requirement.split("=");
    return object.metadata.labels?.[key] === value;
  });
}

/** Answers `get` and `list` of one namespace from a fixed set of objects, as the Kubernetes API does. */
export function createKubeReader(objects: readonly KubeObject[]): CodebaseKubeReader {
  const ofKind = (config: K8sResourceConfig, namespace: string) =>
    objects.filter((object) => object.kind === config.kind && object.metadata.namespace === namespace);

  return {
    async getResource(config, name, namespace) {
      const found = ofKind(config, namespace).find((object) => object.metadata.name === name);
      if (!found) {
        throw new K8sApiError(404, "Not Found", `${config.pluralName} "${name}" not found`);
      }
      return found;
    },
    async listResource(config, namespace, labelSelector) {
      return { items: ofKind(config, namespace).filter((object) => matchesSelector(object, labelSelector)) };
    },
  };
}
