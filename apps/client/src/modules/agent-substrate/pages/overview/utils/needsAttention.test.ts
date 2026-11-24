import { describe, expect, it } from "vitest";
import type { AttentionItem, WorkerPoolAccess, WorkerPoolRow } from "@my-project/shared";
import {
  allClearText,
  checkedText,
  groupAttentionItems,
  groupTitle,
  notCheckedText,
  unschedulableText,
  workerPoolCheckOf,
} from "./needsAttention";

const crashed = (name: string): AttentionItem => ({
  kind: "actorCrashed",
  severity: "error",
  atespace: "krci-agents",
  name,
  message: "out of memory",
  crashedAt: null,
  agent: null,
});

const worker = (name: string, state: "draining" | "unavailable"): AttentionItem => ({
  kind: "workerNotActive",
  severity: state === "draining" ? "warning" : "error",
  name,
  state,
  workerPool: "workers",
  workerNamespace: "krci-agents",
});

const pending = (name: string): AttentionItem => ({
  kind: "snapshotPending",
  severity: "warning",
  atespace: "krci-agents",
  name,
  generation: 2,
  updatedAt: "2026-11-22T09:00:00.000Z",
});

const groupNames = (items: AttentionItem[]) =>
  groupAttentionItems(items).map(({ kind, items }) => [kind, items.map(({ name }) => name)]);

describe("groupAttentionItems", () => {
  it("groups by kind in the order of the items, all workers that are not active in one group", () => {
    const items = [
      crashed("a"),
      crashed("b"),
      worker("w-down", "unavailable"),
      worker("w-drain-1", "draining"),
      worker("w-drain-2", "draining"),
      pending("p"),
    ];

    expect(groupNames(items)).toEqual([
      ["actorCrashed", ["a", "b"]],
      ["workerNotActive", ["w-down", "w-drain-1", "w-drain-2"]],
      ["snapshotPending", ["p"]],
    ]);
  });

  it("gives no group for no item", () => {
    expect(groupAttentionItems([])).toEqual([]);
  });
});

describe("groupTitle", () => {
  it.each([
    ["actorCrashed", "Crashed actors"],
    ["actorUnschedulable", "Actors no worker pool can host"],
    ["workerPoolNotReady", "Worker pools not ready"],
    ["workerNotActive", "Workers not active"],
    ["snapshotPending", "Pending snapshots"],
  ] as const)("names a %s group %s", (kind, title) => {
    expect(groupTitle(kind)).toBe(title);
  });
});

describe("unschedulableText", () => {
  it("names the worker selector as key=value, sorted by key", () => {
    expect(unschedulableText({ workload: "wokers", tier: "gpu" })).toBe(
      "Worker selector tier=gpu, workload=wokers matches no active worker"
    );
  });
});

const RESOURCE = { desiredReplicas: 1, readyReplicas: 1, sandboxClass: "gvisor", resolution: "Resolved" };

function workerPool(name: string, isRead: boolean): WorkerPoolRow {
  const none = { cpuMillicores: 0, memoryBytes: 0, actors: 0 };
  return {
    name,
    namespace: "krci-agents",
    workers: [],
    capacity: none,
    allocated: none,
    workerLabels: {},
    roomSize: null,
    room: 0,
    limitedBy: [],
    roomState: "noWorker",
    resource: isRead ? RESOURCE : null,
  };
}

const check = (access: WorkerPoolAccess, ...workerPools: WorkerPoolRow[]) =>
  workerPoolCheckOf({ access, items: workerPools });

describe("workerPoolCheckOf", () => {
  it("counts the worker pools with a read WorkerPool among all", () => {
    expect(check("denied", workerPool("a", true), workerPool("b", false), workerPool("c", false))).toEqual({
      access: "denied",
      read: 1,
      total: 3,
    });
  });
});

describe("notCheckedText", () => {
  it("says nothing when the worker pools are readable", () => {
    expect(notCheckedText(check("ok", workerPool("a", true)))).toBeNull();
  });

  it("says some worker pools were not checked when one was read", () => {
    expect(notCheckedText(check("denied", workerPool("a", true), workerPool("b", false)))).toBe(
      "Some worker pools not checked: no access"
    );
  });

  it("says the worker pools were not checked when none was read", () => {
    expect(notCheckedText(check("error", workerPool("a", false)))).toBe("Worker pools not checked: error");
  });
});

describe("checkedText", () => {
  const counts = { actors: 7, workers: 1 };

  it("counts actors, workers and worker pools when the worker pools are readable", () => {
    expect(checkedText(counts, check("ok", workerPool("a", true), workerPool("b", false)))).toBe(
      "Checked 7 actors, 1 worker and 2 worker pools."
    );
  });

  it("counts the read worker pools among all when some were read", () => {
    expect(checkedText(counts, check("denied", workerPool("a", true), workerPool("b", false)))).toBe(
      "Checked 7 actors, 1 worker and 1 of 2 worker pools."
    );
  });

  it.each(["denied", "error"] as const)(
    "counts actors and workers only when access is %s and none was read",
    (access) => {
      expect(checkedText({ actors: 1, workers: 0 }, check(access, workerPool("a", false)))).toBe(
        "Checked 1 actor and 0 workers."
      );
    }
  );
});

describe("allClearText", () => {
  it("says nothing needs attention when the worker pools are readable", () => {
    expect(allClearText(check("ok"))).toBe("Nothing needs attention");
  });

  it("says some worker pools were not checked and why when one was read", () => {
    expect(allClearText(check("denied", workerPool("a", true), workerPool("b", false)))).toBe(
      "Nothing needs attention in actors, workers and the worker pools checked; some worker pools not checked (no access)"
    );
  });

  it("says the worker pools were not checked and why when none was read", () => {
    expect(allClearText(check("denied", workerPool("a", false)))).toBe(
      "Nothing needs attention in actors and workers; worker pools not checked (no access)"
    );
    expect(allClearText(check("error"))).toBe(
      "Nothing needs attention in actors and workers; worker pools not checked (error)"
    );
  });
});
