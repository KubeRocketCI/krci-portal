import type { FindingsScope } from "@my-project/shared";
import type { DefectDojoProduct, DefectDojoResult } from "../../../clients/defectDojo/index.js";
import { TAG_KEY, tagValue } from "../codebaseFindings/tags.js";
import { clustersOfStages, defaultRuntimeClusters, sortedUnique, type PlatformFacts } from "./facts.js";

/** The text every tag of a namespace product's cluster starts with: the products the scope reads. */
export const NAMESPACE_PRODUCT_TAG_TEXT = `${TAG_KEY.cluster}:`;

type NamespaceOption = Extract<FindingsScope, { state: "data" }>["namespaces"][number];

/**
 * The clusters and namespaces the platform lists offer: those of the Stages and of the namespace products. A namespace
 * names the first Stage that deploys there. A product without both its cluster and namespace tags is no namespace.
 */
export function toFindingsScope(
  facts: Pick<PlatformFacts, "stages">,
  products: DefectDojoResult<DefectDojoProduct[]>
): FindingsScope {
  if (products.state === "notConfigured" || products.state === "unreachable") {
    return { state: products.state };
  }

  const options = new Map<string, NamespaceOption>();
  const addOption = (option: NamespaceOption) => {
    const key = JSON.stringify([option.cluster, option.namespace]);
    if (!options.has(key)) {
      options.set(key, option);
    }
  };

  for (const { clusterName, namespace, cdPipeline, stage } of facts.stages) {
    addOption({ cluster: clusterName, namespace, environment: { cdPipeline, stage } });
  }
  for (const product of products.state === "data" ? products.data : []) {
    const cluster = tagValue(product.tags, TAG_KEY.cluster);
    const namespace = tagValue(product.tags, TAG_KEY.namespace);
    if (cluster !== null && namespace !== null) {
      addOption({ cluster, namespace, environment: null });
    }
  }

  const namespaces = [...options.values()].sort(
    (a, b) => a.cluster.localeCompare(b.cluster) || a.namespace.localeCompare(b.namespace)
  );

  const clusters = sortedUnique(namespaces.map((option) => option.cluster));
  return {
    state: "data",
    defaultClusters: defaultRuntimeClusters(facts) ?? clusters,
    stageClusters: clustersOfStages(facts),
    clusters,
    namespaces,
  };
}
