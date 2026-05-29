import { describe, expect, it } from "vitest";
import { listRouteSlug, resolveDescriptor } from "./resolve";
import { resourceRegistry } from "./index";
import type { ResourceRegistry } from "./types";

describe("listRouteSlug", () => {
  it("extracts the URL segment after /k8s/", () => {
    expect(listRouteSlug("/c/$clusterName/k8s/crds")).toBe("crds");
    expect(listRouteSlug("/c/$clusterName/k8s/pods")).toBe("pods");
  });

  it("returns null when listRoute is missing or has no /k8s/ segment", () => {
    expect(listRouteSlug(undefined)).toBeNull();
    expect(listRouteSlug("")).toBeNull();
    expect(listRouteSlug("/c/$clusterName/other/crds")).toBeNull();
  });
});

describe("resolveDescriptor", () => {
  it("returns null for unknown kind", () => {
    expect(resolveDescriptor(resourceRegistry, "totally-fake")).toBeNull();
  });

  it("resolves a descriptor whose URL slug differs from its registry key", () => {
    // Verify the slug-based fallback: registry key "widgets" but listRoute slug "wdg".
    const mockRegistry: ResourceRegistry = {
      widgets: {
        config: {
          group: "example.io",
          version: "v1",
          apiVersion: "example.io/v1",
          kind: "Widget",
          singularName: "widget",
          pluralName: "widgets",
        },
        label: "Widgets",
        sidebarGroup: "Workloads",
        detailVariant: "namespaced",
        columns: () => [],
        listRoute: "/c/$clusterName/k8s/wdg",
      },
    };
    const descriptor = resolveDescriptor(mockRegistry, "wdg");
    expect(descriptor).not.toBeNull();
    expect(descriptor?.config.pluralName).toBe("widgets");
  });

  it("resolves directly by registry key when no listRoute override applies", () => {
    expect(resolveDescriptor(resourceRegistry, "pods")?.config.pluralName).toBe("pods");
  });
});
