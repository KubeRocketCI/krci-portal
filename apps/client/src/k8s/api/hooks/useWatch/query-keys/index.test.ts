import { describe, expect, it } from "vitest";
import { getK8sWatchListQueryCacheKey } from "./index";

const cluster = "test-cluster";
const namespace = "test-ns";
const group = "v2.edp.epam.com";
const plural = "codebases";
const labels = { "app.edp.epam.com/type": "application" };

describe("getK8sWatchListQueryCacheKey", () => {
  it("key is unchanged without names", () => {
    const base = getK8sWatchListQueryCacheKey(cluster, namespace, group, plural);

    expect(base).toEqual(["k8s:watchList", cluster, namespace, group, plural]);
    expect(getK8sWatchListQueryCacheKey(cluster, namespace, group, plural, undefined, undefined)).toEqual(base);
    expect(getK8sWatchListQueryCacheKey(cluster, namespace, group, plural, undefined, [])).toEqual(base);
    expect(getK8sWatchListQueryCacheKey(cluster, namespace, group, plural, labels, [])).toEqual(
      getK8sWatchListQueryCacheKey(cluster, namespace, group, plural, labels)
    );
  });

  it("names segment is sorted and order-independent", () => {
    const ordered = getK8sWatchListQueryCacheKey(cluster, namespace, group, plural, undefined, ["a", "b", "c"]);
    const shuffled = getK8sWatchListQueryCacheKey(cluster, namespace, group, plural, undefined, ["c", "a", "b"]);

    expect(ordered).toEqual(shuffled);
    expect(ordered).toEqual(["k8s:watchList", cluster, namespace, group, plural, "names=a,b,c"]);
  });

  it("names and labels produce distinct keys", () => {
    const withLabels = getK8sWatchListQueryCacheKey(cluster, namespace, group, plural, labels);
    const withNames = getK8sWatchListQueryCacheKey(cluster, namespace, group, plural, undefined, ["a"]);
    const withBoth = getK8sWatchListQueryCacheKey(cluster, namespace, group, plural, labels, ["a"]);

    expect(withLabels).not.toEqual(withNames);
    expect(withBoth).not.toEqual(withLabels);
    expect(withBoth).not.toEqual(withNames);
    expect(withBoth).toEqual([...withLabels, "names=a"]);
  });
});
