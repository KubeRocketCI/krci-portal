import { describe, expect, it } from "vitest";
import { replicasText } from "./capacity";

describe("replicasText", () => {
  const resource = { desiredReplicas: 2, readyReplicas: 1, sandboxClass: "gvisor", resolution: "Resolved" };

  it("gives desired and ready replicas of the WorkerPool", () => {
    expect(replicasText(resource, "ok")).toBe("2 desired, 1 ready");
    expect(replicasText(resource, "denied")).toBe("2 desired, 1 ready");
  });

  it("says why there are no replicas", () => {
    expect(replicasText(null, "denied")).toBe("no access");
    expect(replicasText(null, "error")).toBe("not readable");
    expect(replicasText(null, "ok")).toBe("no WorkerPool resource");
  });
});
