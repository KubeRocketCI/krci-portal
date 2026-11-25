import { readFileSync } from "node:fs";
import { createKubeReader, type KubeObject } from "../../src/routers/defectDojo/__fixtures__/kubeReader.js";
import type { FindingsKubeReader } from "../../src/routers/defectDojo/kube.js";

/** Answers `get` and `list` from the objects of a `kubectl get -o json` dump. */
export function readKubeObjectsFile(path: string): FindingsKubeReader {
  const dump: { items: KubeObject[] } = JSON.parse(readFileSync(path, "utf8"));
  return createKubeReader(dump.items);
}
