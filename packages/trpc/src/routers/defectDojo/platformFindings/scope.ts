import type { FindingsScope, FindingsScopeNamespace } from "@my-project/shared";
import { isOutage, type DefectDojoProduct, type DefectDojoResult } from "../../../clients/defectDojo/index.js";
import { TAG_KEY, tagValue } from "../codebaseFindings/tags.js";
import { clustersOfStages, defaultRuntimeClusters, sortedUnique, type PlatformFacts } from "./facts.js";

/** The text every tag of a namespace product's cluster starts with: the products the scope reads. */
export const NAMESPACE_PRODUCT_TAG_TEXT = `${TAG_KEY.cluster}:`;

export interface Place {
  cluster: string;
  namespace: string;
}

export function placeKey({ cluster, namespace }: Place): string {
  return JSON.stringify([cluster, namespace]);
}

/** The cluster and namespace of a namespace product, or `null`: a product without both tags is no namespace. */
export function namespaceOf(product: DefectDojoProduct): Place | null {
  const cluster = tagValue(product.tags, TAG_KEY.cluster);
  const namespace = tagValue(product.tags, TAG_KEY.namespace);
  return cluster !== null && namespace !== null ? { cluster, namespace } : null;
}

/**
 * The clusters and namespaces the platform lists offer: those of the Stages and of the namespace products. A namespace
 * names the first Stage that deploys there. A product without both its cluster and namespace tags is no namespace.
 */
export function toFindingsScope(
  facts: Pick<PlatformFacts, "stages">,
  products: DefectDojoResult<DefectDojoProduct[]>
): FindingsScope {
  if (isOutage(products)) {
    return { state: products.state };
  }
  return findingsScopeOf(
    facts,
    (products.state === "data" ? products.data : []).flatMap((product) => namespaceOf(product) ?? [])
  );
}

/** The scope of the Stages and of the namespaces of the namespace products, `places`. */
export function findingsScopeOf(
  facts: Pick<PlatformFacts, "stages">,
  places: readonly Place[]
): Extract<FindingsScope, { state: "data" }> {
  const options = new Map<string, FindingsScopeNamespace>();
  const addOption = (option: FindingsScopeNamespace) => {
    const key = placeKey(option);
    if (!options.has(key)) {
      options.set(key, option);
    }
  };

  for (const { clusterName, namespace, cdPipeline, stage } of facts.stages) {
    addOption({ cluster: clusterName, namespace, environment: { cdPipeline, stage } });
  }
  for (const place of places) {
    addOption({ ...place, environment: null });
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
