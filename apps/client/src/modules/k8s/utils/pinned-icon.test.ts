import { describe, expect, it } from "vitest";
import { Bell, PanelsTopLeft, Puzzle } from "lucide-react";
import { resourceRegistry } from "../registry";
import { groupIconMap } from "../constants/nav";
import { getK8sPinnedPageIcon } from "./pinned-icon";

const page = (to: string, params: Record<string, string> = {}) => ({ route: { to, params } });

describe("getK8sPinnedPageIcon", () => {
  it("resolves generic-template kinds from the kind param", () => {
    const descriptor = resourceRegistry.deployments;
    const expected = descriptor.sidebarIcon ?? groupIconMap[descriptor.sidebarGroup];

    expect(getK8sPinnedPageIcon(page("/c/$clusterName/k8s/$kind", { clusterName: "dev", kind: "deployments" }))).toBe(
      expected
    );
  });

  it("resolves dedicated list routes from the path slug", () => {
    const descriptor = resourceRegistry.pods;
    const expected = descriptor.sidebarIcon ?? groupIconMap[descriptor.sidebarGroup];

    expect(getK8sPinnedPageIcon(page("/c/$clusterName/k8s/pods", { clusterName: "dev" }))).toBe(expected);
  });

  it("maps overview, events, and custom-resource routes to their static icons", () => {
    expect(getK8sPinnedPageIcon(page("/c/$clusterName/k8s/overview"))).toBe(PanelsTopLeft);
    expect(getK8sPinnedPageIcon(page("/c/$clusterName/k8s/events"))).toBe(Bell);
    expect(
      getK8sPinnedPageIcon(
        page("/c/$clusterName/k8s/cr/$group/$version/$plural", { group: "g", version: "v1", plural: "things" })
      )
    ).toBe(Puzzle);
  });

  it("returns undefined for non-K8s routes so callers fall back to PAGE_ICONS", () => {
    expect(getK8sPinnedPageIcon(page("/c/$clusterName/cicd/pipelines"))).toBeUndefined();
    expect(getK8sPinnedPageIcon(page("/c/$clusterName/projects"))).toBeUndefined();
  });

  it("ignores a /k8s/ segment outside the K8s route prefix", () => {
    expect(getK8sPinnedPageIcon(page("/c/$clusterName/cicd/k8s/pods"))).toBeUndefined();
    expect(getK8sPinnedPageIcon(page("/other/k8s/pods"))).toBeUndefined();
  });

  it("returns undefined for unknown or missing kinds", () => {
    expect(getK8sPinnedPageIcon(page("/c/$clusterName/k8s/$kind", { kind: "nonexistent" }))).toBeUndefined();
    expect(getK8sPinnedPageIcon(page("/c/$clusterName/k8s/$kind"))).toBeUndefined();
  });
});
