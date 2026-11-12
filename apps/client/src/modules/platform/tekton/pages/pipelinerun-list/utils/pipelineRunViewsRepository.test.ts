import { beforeEach, describe, expect, it, vi } from "vitest";
import { LS_KEY_PIPELINERUN_VIEWS } from "@/core/services/local-storage/keys";
import { sortByName } from "@/core/utils/sortByName";
import { localStoragePipelineRunViewsRepository, parsePipelineRunViewsStore } from "./pipelineRunViewsRepository";

const view = (overrides: Record<string, unknown> = {}) => ({
  id: "v_1",
  name: "Mine",
  filters: { codebases: ["codemie"] },
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

const envelope = (clusters: Record<string, unknown[]>) => JSON.stringify({ version: 1, clusters });

describe("parsePipelineRunViewsStore", () => {
  it("reads an absent, corrupt or foreign value as empty", () => {
    for (const raw of [null, "{not json", "[]"]) {
      const store = parsePipelineRunViewsStore(raw);
      expect(store.version).toBe(1);
      expect(Object.keys(store.clusters)).toEqual([]);
      expect(store.readOnly).toBeUndefined();
    }
  });

  it("marks a store of an unknown version read-only", () => {
    const store = parsePipelineRunViewsStore(JSON.stringify({ version: 2, clusters: { core: [view()] } }));
    expect(store.readOnly).toBe(true);
    expect(Object.keys(store.clusters)).toEqual([]);
  });

  it("drops a damaged cluster entry and keeps the other clusters", () => {
    const store = parsePipelineRunViewsStore(envelope({ core: [view()], broken: "oops" as never }));
    expect(Object.keys(store.clusters)).toEqual(["core"]);
    expect(store.readOnly).toBeUndefined();
  });

  it("keeps cluster names that match Object.prototype members as plain keys", () => {
    const raw = `{"version":1,"clusters":{"__proto__":[${JSON.stringify(view())}],"constructor":[${JSON.stringify(view({ id: "v_2" }))}]}}`;
    const store = parsePipelineRunViewsStore(raw);
    expect(Object.getPrototypeOf(store.clusters)).toBeNull();
    expect(Object.keys(store.clusters).sort(sortByName)).toEqual(["__proto__", "constructor"]);
    expect(store.clusters["__proto__"][0].id).toBe("v_1");
  });

  it("keeps valid views per cluster", () => {
    const store = parsePipelineRunViewsStore(envelope({ core: [view()] }));
    expect(store.version).toBe(1);
    expect({ ...store.clusters }).toEqual({ core: [view()] });
  });

  it("drops invalid views, duplicate ids and empty clusters", () => {
    const store = parsePipelineRunViewsStore(
      envelope({
        core: [view(), view({ name: "Dup id" }), view({ id: "1e5" }), view({ id: "v_2", name: "  " }), "x"],
        empty: [view({ id: "bad" })],
      })
    );
    expect({ ...store.clusters }).toEqual({ core: [view()] });
  });

  it("sanitizes stored filters", () => {
    const store = parsePipelineRunViewsStore(
      envelope({ core: [view({ filters: { status: "true", codebases: "a", unknown: 1 } })] })
    );
    expect(store.clusters.core[0].filters).toEqual({ status: "succeeded", codebases: ["a"] });
  });

  it("replaces non-object filters with none", () => {
    const store = parsePipelineRunViewsStore(envelope({ core: [view({ filters: "x" })] }));
    expect(store.clusters.core[0].filters).toEqual({});
  });
});

describe("localStoragePipelineRunViewsRepository", () => {
  beforeEach(() => localStorage.clear());

  it("returns the same reference while storage is unchanged", () => {
    localStorage.setItem(LS_KEY_PIPELINERUN_VIEWS, envelope({ core: [view()] }));
    const first = localStoragePipelineRunViewsRepository.read();
    expect(localStoragePipelineRunViewsRepository.read()).toBe(first);

    localStorage.setItem(LS_KEY_PIPELINERUN_VIEWS, envelope({ core: [view({ name: "Renamed" })] }));
    expect(localStoragePipelineRunViewsRepository.read()).not.toBe(first);
  });

  it("notifies subscribers on write and on a storage event for its key", () => {
    const listener = vi.fn();
    const unsubscribe = localStoragePipelineRunViewsRepository.subscribe(listener);

    localStoragePipelineRunViewsRepository.write({ version: 1, clusters: {} });
    window.dispatchEvent(new StorageEvent("storage", { key: LS_KEY_PIPELINERUN_VIEWS }));
    window.dispatchEvent(new StorageEvent("storage", { key: "other" }));
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    window.dispatchEvent(new StorageEvent("storage", { key: LS_KEY_PIPELINERUN_VIEWS }));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("propagates a rejected write", () => {
    vi.mocked(localStorage.setItem).mockImplementationOnce(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(() => localStoragePipelineRunViewsRepository.write({ version: 1, clusters: {} })).toThrow();
  });
});
