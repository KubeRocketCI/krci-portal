import { readFileSync } from "node:fs";
import { k8sCodebaseConfig } from "@my-project/shared";
import { createKubeReader, type KubeObject } from "../../src/routers/defectDojo/__fixtures__/kubeReader.js";
import { sortedUnique } from "../../src/routers/defectDojo/platformFindings/facts.js";
import type { FindingsKubeReader } from "../../src/routers/defectDojo/kube.js";

/** Answers `get` and `list` from the objects of a `kubectl get -o json` dump. */
export function readKubeObjectsFile(path: string): FindingsKubeReader {
  const dump: { items: KubeObject[] } = JSON.parse(readFileSync(path, "utf8"));
  return createKubeReader(dump.items);
}

export async function readCodebaseNames(reader: FindingsKubeReader, namespace: string): Promise<string[]> {
  const { items } = await reader.listResource(k8sCodebaseConfig, namespace);
  return sortedUnique(items.map((item) => (item as KubeObject).metadata.name));
}
