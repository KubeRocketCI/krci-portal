import { Eye, Puzzle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import type { CRDObject, KubeObjectBase } from "@my-project/shared";
import type { ResourceDescriptor } from "../types";
import type { RenderName } from "../descriptors/columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import { PrinterColumnValue } from "@/modules/k8s/components/PrinterColumnValue";
import { makeNameColumn, namespaceColumn, ageColumn } from "../descriptors/columnHelpers";
import { resolveCRDVersion, CREATION_TIMESTAMP_PRINTER_COL_PATH } from "./crdUtils";
import { PATH_K8S_CR_DETAIL_NS_FULL, PATH_K8S_CR_DETAIL_CLUSTER_FULL } from "@/modules/k8s/constants/paths";
import { getFirstClassCROverride } from "./firstClass";

export function buildCRDescriptor(crd: CRDObject, preferredVersion?: string): ResourceDescriptor {
  const group = crd.spec.group;
  const plural = crd.spec.names.plural;
  const resolved = resolveCRDVersion(crd, preferredVersion);

  if (!resolved) {
    // A CRD with zero versions is invalid per the K8s API contract, but guard
    // defensively so a malformed cluster object does not throw here.
    throw new Error(`CRD "${crd.metadata?.name ?? crd.spec.names.kind}" has no versions defined`);
  }

  const version = resolved.name;
  const clusterScoped = crd.spec.scope === "Cluster";
  const override = getFirstClassCROverride(group, crd.spec.names.kind);

  return {
    config: {
      apiVersion: group ? `${group}/${version}` : version,
      kind: crd.spec.names.kind,
      group,
      version,
      singularName: crd.spec.names.singular ?? crd.spec.names.kind.toLowerCase(),
      pluralName: plural,
      clusterScoped,
    },
    label: crd.spec.names.kind,
    sidebarGroup: "CustomResources",
    sidebarIcon: Puzzle,
    detailVariant: clusterScoped ? "cluster" : "namespaced",
    customResource: true,
    defaultSort: { sortBy: "name", order: "asc" },
    columns: override?.columns ?? makeCRColumns(crd, resolved, version),
    overviewTab: override?.overviewTab,
  };
}

function makeCRColumns(crd: CRDObject, resolvedVersion: CRDObject["spec"]["versions"][number], version: string) {
  return (renderName: RenderName): TableColumn<KubeObjectBase>[] => {
    const base: TableColumn<KubeObjectBase>[] = [makeNameColumn(renderName)];
    if (crd.spec.scope === "Namespaced") base.push(namespaceColumn);

    const printerCols = (resolvedVersion.additionalPrinterColumns ?? []).filter(
      (c) => c.jsonPath !== CREATION_TIMESTAMP_PRINTER_COL_PATH
    );
    const visible = printerCols.filter((c) => (c.priority ?? 0) === 0);

    visible.forEach((col, idx) => {
      base.push({
        // A malformed CRD can declare two printer columns with the same `name`;
        // suffix the index so the table never has two columns with the same id.
        id: `${col.name}-${idx}`,
        label: col.name,
        data: {
          render: ({ data }) => <PrinterColumnValue item={data} jsonPath={col.jsonPath} type={col.type} />,
        },
        cell: { baseWidth: 12 },
      });
    });
    base.push(ageColumn);

    if (visible.length === 0) base.push(yamlIconColumn(crd, version));
    return base;
  };
}

function yamlIconColumn(crd: CRDObject, version: string): TableColumn<KubeObjectBase> {
  return {
    id: "yaml-action",
    label: "",
    data: {
      render: ({ data }) => {
        const ns = data.metadata?.namespace;
        const linkParams =
          crd.spec.scope === "Cluster"
            ? {
                to: PATH_K8S_CR_DETAIL_CLUSTER_FULL,
                params: {
                  group: crd.spec.group,
                  version,
                  plural: crd.spec.names.plural,
                  name: data.metadata?.name ?? "",
                },
              }
            : {
                to: PATH_K8S_CR_DETAIL_NS_FULL,
                params: {
                  group: crd.spec.group,
                  version,
                  plural: crd.spec.names.plural,
                  namespace: ns ?? "",
                  name: data.metadata?.name ?? "",
                },
              };
        return (
          <Button asChild variant="ghost" size="icon" title="View YAML">
            <Link to={linkParams.to as never} params={linkParams.params as never} search={{ tab: "yaml" } as never}>
              <Eye className="size-4" />
            </Link>
          </Button>
        );
      },
    },
    cell: { baseWidth: 4 },
  };
}
