import { describe, expect, it } from "vitest";
import { workerAnchor, workerPoolAnchor } from "./rowAnchor";

describe("rowAnchor", () => {
  it("names a worker by worker namespace, worker pool and name", () => {
    expect(workerAnchor({ workerNamespace: "krci-agents", workerPool: "workers", name: "5e2b8c41" })).toBe(
      "worker/krci-agents/workers/5e2b8c41"
    );
  });

  it("keeps workers of the same name in different worker pools apart", () => {
    const inWorkers = workerAnchor({ workerNamespace: "krci-agents", workerPool: "workers", name: "w1" });
    const inSpare = workerAnchor({ workerNamespace: "krci-agents", workerPool: "spare", name: "w1" });

    expect(inWorkers).not.toBe(inSpare);
  });

  it("names a worker pool by namespace and name", () => {
    expect(workerPoolAnchor({ namespace: "krci-agents", name: "workers-microvm" })).toBe(
      "worker-pool/krci-agents/workers-microvm"
    );
  });
});
