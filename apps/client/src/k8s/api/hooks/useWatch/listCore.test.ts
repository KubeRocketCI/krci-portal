import { afterEach, describe, expect, it, vi } from "vitest";
import type { KubeObjectBase } from "@my-project/shared";
import type { RequestError } from "@/core/types/global";
import {
  applyWatchEvent,
  deriveListStatus,
  getListSnapshotKey,
  mergeNamespaceLists,
  NamespaceListState,
} from "./listCore";
import { CustomKubeObjectList, MSG_TYPE, WatchEvent } from "./types";

const makeItem = (name: string, resourceVersion: string, namespace = "ns-a"): KubeObjectBase =>
  ({
    apiVersion: "v1",
    kind: "ConfigMap",
    metadata: { name, namespace, resourceVersion },
  }) as KubeObjectBase;

const makeList = (items: KubeObjectBase[], resourceVersion = "100"): CustomKubeObjectList<KubeObjectBase> => ({
  apiVersion: "v1",
  kind: "ConfigMapList",
  metadata: { resourceVersion },
  items: new Map(items.map((item) => [item.metadata.name!, item])),
});

const event = (type: WatchEvent<KubeObjectBase>["type"], data: KubeObjectBase): WatchEvent<KubeObjectBase> => ({
  type,
  data,
});

const requestError = (message: string) => ({ message }) as RequestError;

const loaded = (list: CustomKubeObjectList<KubeObjectBase>): NamespaceListState<KubeObjectBase> => ({
  data: list,
  error: null,
  isError: false,
  isPending: false,
  isSuccess: true,
  isPlaceholderData: false,
  status: "success",
  dataUpdatedAt: 1,
  errorUpdatedAt: 0,
});

const placeholder = (): NamespaceListState<KubeObjectBase> => ({
  data: makeList([], ""),
  error: null,
  isError: false,
  isPending: false,
  isSuccess: true,
  isPlaceholderData: true,
  status: "success",
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
});

const failed = (message: string): NamespaceListState<KubeObjectBase> => ({
  data: undefined,
  error: requestError(message),
  isError: true,
  isPending: false,
  isSuccess: false,
  isPlaceholderData: false,
  status: "error",
  dataUpdatedAt: 0,
  errorUpdatedAt: 1,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("applyWatchEvent", () => {
  it("adds the item and advances the list resourceVersion", () => {
    const list = makeList([makeItem("a", "100")]);

    const next = applyWatchEvent(list, event(MSG_TYPE.ADDED, makeItem("b", "101")));

    expect([...next.items.keys()]).toEqual(["a", "b"]);
    expect(next.metadata.resourceVersion).toBe("101");
    expect(list.items.has("b")).toBe(false);
  });

  it("drops a MODIFIED event older than the cached item", () => {
    const list = makeList([makeItem("a", "105")]);

    const next = applyWatchEvent(list, event(MSG_TYPE.MODIFIED, makeItem("a", "104")));

    expect(next).toBe(list);
  });

  it("applies a MODIFIED event with the same resourceVersion as the cached item", () => {
    const cached = makeItem("a", "105");
    const incoming = { ...makeItem("a", "105"), kind: "Updated" };
    const list = makeList([cached]);

    const next = applyWatchEvent(list, event(MSG_TYPE.MODIFIED, incoming));

    expect(next.items.get("a")).toBe(incoming);
  });

  it("applies a MODIFIED event newer than the cached item", () => {
    const incoming = makeItem("a", "106");
    const list = makeList([makeItem("a", "105")]);

    const next = applyWatchEvent(list, event(MSG_TYPE.MODIFIED, incoming));

    expect(next.items.get("a")).toBe(incoming);
    expect(next.metadata.resourceVersion).toBe("106");
  });

  it("applies a MODIFIED event for an item not yet in the list", () => {
    const incoming = makeItem("new", "106");

    const next = applyWatchEvent(makeList([]), event(MSG_TYPE.MODIFIED, incoming));

    expect(next.items.get("new")).toBe(incoming);
  });

  it("removes the item on DELETED", () => {
    const list = makeList([makeItem("a", "100"), makeItem("b", "100")]);

    const next = applyWatchEvent(list, event(MSG_TYPE.DELETED, makeItem("a", "107")));

    expect([...next.items.keys()]).toEqual(["b"]);
    expect(next.metadata.resourceVersion).toBe("107");
  });

  it("logs an ERROR event and leaves the list unchanged", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const list = makeList([makeItem("a", "100")]);
    const errorEvent = event(MSG_TYPE.ERROR, makeItem("a", "999"));

    const next = applyWatchEvent(list, errorEvent);

    expect(next).toBe(list);
    expect(consoleError).toHaveBeenCalledWith("Error in watch event:", errorEvent);
  });
});

describe("mergeNamespaceLists", () => {
  it("keys items by namespace and name across namespaces", () => {
    const a = makeItem("app", "1", "ns-a");
    const b = makeItem("app", "2", "ns-b");

    const merged = mergeNamespaceLists(["ns-a", "ns-b"], [loaded(makeList([a])), loaded(makeList([b]))]);

    expect([...merged.map.keys()]).toEqual(["ns-a/app", "ns-b/app"]);
    expect(merged.array).toEqual([a, b]);
  });

  it("keys a cluster-scoped list with an empty namespace", () => {
    const node = makeItem("node-1", "1");

    const merged = mergeNamespaceLists([undefined], [loaded(makeList([node]))]);

    expect([...merged.map.keys()]).toEqual(["/node-1"]);
  });

  it("leaves out an errored namespace and keeps the others", () => {
    const a = makeItem("app", "1", "ns-a");

    const merged = mergeNamespaceLists(["ns-a", "ns-b"], [loaded(makeList([a])), failed("forbidden")]);

    expect(merged.array).toEqual([a]);
  });

  it("applies the transform to the merged map without touching the source lists", () => {
    const a = makeItem("app", "1", "ns-a");
    const source = makeList([a]);
    const transform = (items: Map<string, KubeObjectBase>) =>
      new Map([...items].map(([key, item]) => [key, { ...item, kind: "Transformed" }]));

    const merged = mergeNamespaceLists(["ns-a"], [loaded(source)], transform);

    expect(merged.map.get("ns-a/app")?.kind).toBe("Transformed");
    expect(merged.array[0].kind).toBe("Transformed");
    expect(source.items.get("app")).toBe(a);
  });
});

describe("deriveListStatus", () => {
  it("is ready and not loading when every namespace has loaded", () => {
    const status = deriveListStatus([loaded(makeList([])), loaded(makeList([]))], false);

    expect(status).toEqual({ isLoading: false, isReady: true, errors: [] });
  });

  it("keeps loading while any namespace shows placeholder data", () => {
    const status = deriveListStatus([loaded(makeList([])), placeholder()], false);

    expect(status.isLoading).toBe(true);
    expect(status.isReady).toBe(false);
  });

  it("reports a partial error without blocking the loaded namespaces", () => {
    const error = failed("forbidden");

    const status = deriveListStatus([loaded(makeList([])), error], false);

    expect(status.isLoading).toBe(false);
    expect(status.isReady).toBe(false);
    expect(status.errors).toEqual([error.error]);
  });

  it("settles loading when the type is not served", () => {
    const status = deriveListStatus([placeholder()], true);

    expect(status.isLoading).toBe(false);
    expect(status.isReady).toBe(false);
  });
});

describe("getListSnapshotKey", () => {
  it("is equal for equal query states", () => {
    const list = makeList([]);

    expect(getListSnapshotKey(["q1"], [loaded(list)])).toBe(getListSnapshotKey(["q1"], [loaded(list)]));
  });

  it("changes when a namespace's resourceVersion, status or query identity changes", () => {
    const base = getListSnapshotKey(["q1"], [loaded(makeList([], "100"))]);

    expect(getListSnapshotKey(["q1"], [loaded(makeList([], "101"))])).not.toBe(base);
    expect(getListSnapshotKey(["q1"], [failed("x")])).not.toBe(base);
    expect(getListSnapshotKey(["q2"], [loaded(makeList([], "100"))])).not.toBe(base);
  });
});
