import { describe, expect, it, vi } from "vitest";
import { createRandomString } from "@my-project/shared";
import { act, renderHook } from "@testing-library/react";
import { PIPELINERUN_VIEW_NAME_MAX_LENGTH, PIPELINERUN_VIEWS_MAX_PER_CLUSTER } from "../constants";
import type { PipelineRunView, PipelineRunViewsStore } from "../types";
import type { PipelineRunViewsRepository } from "../utils/pipelineRunViewsRepository";
import { usePipelineRunViews } from "./usePipelineRunViews";

vi.mock("@my-project/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@my-project/shared")>();
  return { ...actual, createRandomString: vi.fn(actual.createRandomString) };
});

const createMemoryRepository = (initial: PipelineRunViewsStore = { version: 1, clusters: {} }) => {
  let store = initial;
  let listeners: Array<() => void> = [];
  const repository: PipelineRunViewsRepository & { set: (next: PipelineRunViewsStore) => void } = {
    read: () => store,
    write: vi.fn((next: PipelineRunViewsStore) => {
      store = next;
      listeners.forEach((l) => l());
    }),
    subscribe: (listener) => {
      listeners = [...listeners, listener];
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
    set: (next) => {
      store = next;
      listeners.forEach((l) => l());
    },
  };
  return repository;
};

const view = (id: string, name: string): PipelineRunView => ({ id, name, filters: {}, createdAt: 1, updatedAt: 1 });

const setup = (initial?: PipelineRunViewsStore, clusterName = "core") => {
  const repository = createMemoryRepository(initial);
  const hook = renderHook(() => usePipelineRunViews(clusterName, repository));
  return { repository, hook };
};

describe("usePipelineRunViews", () => {
  it("refuses writes to a store of an unknown version", () => {
    const { hook, repository } = setup({ version: 1, clusters: {}, readOnly: true });

    expect(hook.result.current.create("Mine", {})).toEqual({ ok: false, error: "unsupported-version" });
    expect(repository.write).not.toHaveBeenCalled();
  });

  it("works for a cluster named like an Object.prototype member", () => {
    const { hook } = setup(undefined, "constructor");

    expect(hook.result.current.views).toEqual([]);
    act(() => {
      hook.result.current.create("Mine", {});
    });
    expect(hook.result.current.views.map((v) => v.name)).toEqual(["Mine"]);
  });

  it("creates a view with a prefixed id, trimmed name and sanitized filters", () => {
    const { hook } = setup();

    let result!: ReturnType<typeof hook.result.current.create>;
    act(() => {
      result = hook.result.current.create("  My projects ", { codebases: ["b", "a"], status: "all" });
    });

    expect(result.ok).toBe(true);
    const [created] = hook.result.current.views;
    expect(created.id).toMatch(/^v_[0-9a-f]{8}$/);
    expect(created.name).toBe("My projects");
    expect(created.filters).toEqual({ codebases: ["b", "a"] });
  });

  it("draws a new id when the random one is already taken", () => {
    const { hook } = setup({ version: 1, clusters: { core: [view("v_aaaaaaaa", "Mine")] } });
    vi.mocked(createRandomString).mockReturnValueOnce("aaaaaaaa").mockReturnValueOnce("bbbbbbbb");

    act(() => {
      hook.result.current.create("Other", {});
    });

    expect(hook.result.current.views.map((v) => v.id)).toEqual(["v_aaaaaaaa", "v_bbbbbbbb"]);
  });

  it("rejects empty, too long and duplicate names (case-insensitive)", () => {
    const { hook } = setup({ version: 1, clusters: { core: [view("v_1", "Mine")] } });

    expect(hook.result.current.create("   ", {})).toEqual({ ok: false, error: "invalid-name" });
    expect(hook.result.current.create("x".repeat(PIPELINERUN_VIEW_NAME_MAX_LENGTH + 1), {})).toEqual({
      ok: false,
      error: "invalid-name",
    });
    expect(hook.result.current.create("mine", {})).toEqual({ ok: false, error: "duplicate-name" });
  });

  it("enforces the per-cluster limit", () => {
    const views = Array.from({ length: PIPELINERUN_VIEWS_MAX_PER_CLUSTER }, (_, i) => view(`v_${i}`, `View ${i}`));
    const { hook } = setup({ version: 1, clusters: { core: views } });

    expect(hook.result.current.create("One more", {})).toEqual({ ok: false, error: "limit" });
  });

  it("keeps views of other clusters apart", () => {
    const { hook, repository } = setup({ version: 1, clusters: { other: [view("v_9", "Other")] } });

    expect(hook.result.current.views).toEqual([]);
    act(() => {
      hook.result.current.create("Mine", {});
    });

    expect(repository.read().clusters.other).toEqual([view("v_9", "Other")]);
    expect(repository.read().clusters.core).toHaveLength(1);
  });

  it("renames and updates filters", () => {
    const { hook } = setup({ version: 1, clusters: { core: [view("v_1", "Mine"), view("v_2", "Theirs")] } });

    expect(hook.result.current.update("v_1", { name: "theirs" })).toEqual({ ok: false, error: "duplicate-name" });

    act(() => {
      hook.result.current.update("v_1", { name: "Renamed", filters: { pipelineType: "build" } });
    });

    expect(hook.result.current.getById("v_1")).toMatchObject({ name: "Renamed", filters: { pipelineType: "build" } });
    expect(hook.result.current.update("v_404", { name: "x" })).toEqual({ ok: false, error: "not-found" });
  });

  it("removes a view and drops the empty cluster entry", () => {
    const { hook, repository } = setup({ version: 1, clusters: { core: [view("v_1", "Mine")] } });

    act(() => {
      hook.result.current.remove("v_1");
    });

    expect(hook.result.current.views).toEqual([]);
    expect(Object.keys(repository.read().clusters)).toEqual([]);
  });

  it("writes on top of changes made elsewhere", () => {
    const { hook, repository } = setup({ version: 1, clusters: { core: [view("v_1", "Mine")] } });

    act(() => repository.set({ version: 1, clusters: { core: [view("v_1", "Mine"), view("v_2", "From tab B")] } }));
    act(() => {
      hook.result.current.create("From tab A", {});
    });

    expect(hook.result.current.views.map((v) => v.name)).toEqual(["Mine", "From tab B", "From tab A"]);
  });

  it("reports a storage failure and keeps the state", () => {
    const { hook, repository } = setup();
    vi.mocked(repository.write).mockImplementationOnce(() => {
      throw new DOMException("full", "QuotaExceededError");
    });

    expect(hook.result.current.create("Mine", {})).toEqual({ ok: false, error: "storage" });
    expect(hook.result.current.views).toEqual([]);
  });
});
