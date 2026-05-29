import { useMemo } from "react";
import { Puzzle } from "lucide-react";
import { useCRDList } from "@/modules/k8s/hooks/useCRDList";
import { storageVersionName, escapeRe } from "@/modules/k8s/registry/dynamic/crdUtils";
import { PATH_K8S_CR_LIST_FULL } from "@/modules/k8s/constants/paths";
import type { NavCollapsibleSubGroupItem, SimpleNavItem } from "@/core/components/sidebar/types";
import type { CRDObject } from "@my-project/shared";

export function useCRSidebarItems(clusterName: string): NavCollapsibleSubGroupItem[] {
  const { data, error } = useCRDList();
  return useMemo(() => {
    if (error || !data.array.length) return [];

    const byGroup = new Map<string, CRDObject[]>();
    for (const crd of data.array) {
      // CRD spec.group is a required field per the Kubernetes API spec.
      // Skip at the groupBy step so no empty-title subgroup header is emitted in the sidebar.
      // An empty group would also produce a regex like `//` that never matches real URLs.
      if (!crd.spec.group) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[useCRSidebarItems] CRD "${crd.metadata.name}" has an empty spec.group; skipping.`);
        }
        continue;
      }
      const arr = byGroup.get(crd.spec.group) ?? [];
      arr.push(crd);
      byGroup.set(crd.spec.group, arr);
    }

    return Array.from(byGroup.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, crdsInGroup]) => ({
        kind: "collapsible-subgroup" as const,
        title: group,
        defaultOpen: false,
        children: crdsInGroup
          .slice()
          .sort((a, b) => a.spec.names.kind.localeCompare(b.spec.names.kind))
          .flatMap<SimpleNavItem>((crd) => {
            // storageVersionName throws when crd.spec.versions is empty (malformed CRD).
            // Skip the offending CRD instead of crashing the entire sidebar render tree.
            let version: string;
            try {
              version = storageVersionName(crd);
            } catch {
              return [];
            }
            // Matches list, namespaced detail (ns/), and cluster-scoped detail (cluster/) paths:
            //   /k8s/cr/$group/$version/$plural
            //   /k8s/cr/ns/$group/$version/$plural/$namespace/$name
            //   /k8s/cr/cluster/$group/$version/$plural/$name
            const activeRe = new RegExp(
              `/k8s/cr/(cluster/|ns/)?${escapeRe(crd.spec.group)}/[^/]+/${escapeRe(crd.spec.names.plural)}(/|$)`
            );
            return [
              {
                title: crd.spec.names.kind,
                icon: Puzzle,
                route: {
                  to: PATH_K8S_CR_LIST_FULL,
                  params: {
                    clusterName,
                    group: crd.spec.group,
                    version,
                    plural: crd.spec.names.plural,
                  },
                } as SimpleNavItem["route"],
                isActiveFn: (pathname: string) => activeRe.test(pathname),
              },
            ];
          }),
      }));
  }, [data.array, error, clusterName]);
}
