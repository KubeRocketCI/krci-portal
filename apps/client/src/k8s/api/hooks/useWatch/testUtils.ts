import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";
import { getK8sWatchListQueryCacheKey } from "./query-keys";

/** Cluster store state for the `@/k8s/store` mock; `allowedNamespaces` match the keys of `listsByNamespace`. */
export const testClusterState = {
  clusterName: "test-cluster",
  defaultNamespace: "ns-a",
  allowedNamespaces: ["ns-a", "ns-b"],
};

export const codebaseConfig: K8sResourceConfig = {
  apiVersion: "v2.edp.epam.com/v1",
  group: "v2.edp.epam.com",
  version: "v1",
  kind: "Codebase",
  singularName: "codebase",
  pluralName: "codebases",
};

export const makeItem = (name: string, namespace: string | undefined, resourceVersion: string): KubeObjectBase =>
  ({
    apiVersion: "v2.edp.epam.com/v1",
    kind: "Codebase",
    metadata: { name, namespace, resourceVersion },
  }) as KubeObjectBase;

export const makeList = (items: KubeObjectBase[], resourceVersion: string) => ({
  apiVersion: "v2.edp.epam.com/v1",
  kind: "CodebaseList",
  metadata: { resourceVersion },
  items,
});

export type TestList = ReturnType<typeof makeList>;

export const listsByNamespace: Record<string, TestList> = {
  "ns-a": makeList([makeItem("app-a", "ns-a", "10")], "10"),
  "ns-b": makeList([makeItem("app-b", "ns-b", "20")], "20"),
};

export const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

export const watchListKey = (namespace: string | undefined, resourceConfig: K8sResourceConfig = codebaseConfig) =>
  JSON.stringify(
    getK8sWatchListQueryCacheKey(
      testClusterState.clusterName,
      namespace,
      resourceConfig.group,
      resourceConfig.pluralName
    )
  );
