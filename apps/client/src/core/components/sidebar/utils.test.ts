import { describe, expect, it } from "vitest";
import { createPinTarget } from "./utils";

// Pin identity and icon derivation are covered by usePinnedItems.test.ts; this
// only verifies the conversion from router link props to a PinTarget.

describe("createPinTarget", () => {
  it("copies the title and route", () => {
    const target = createPinTarget("Deployments", {
      to: "/c/$clusterName/k8s/$kind",
      params: { clusterName: "dev", kind: "deployments" },
    } as Parameters<typeof createPinTarget>[1]);

    expect(target).toEqual({
      label: "Deployments",
      route: { to: "/c/$clusterName/k8s/$kind", params: { clusterName: "dev", kind: "deployments" } },
    });
  });

  it("defaults a missing path to / and missing params to {}", () => {
    const target = createPinTarget("Home", {} as Parameters<typeof createPinTarget>[1]);

    expect(target.route).toEqual({ to: "/", params: {} });
  });
});
