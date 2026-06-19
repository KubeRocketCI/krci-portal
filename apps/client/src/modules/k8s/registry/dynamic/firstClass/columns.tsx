import type { RenderName } from "../../descriptors/columnHelpers";
import type { TableColumn } from "@/core/components/Table/types";
import type {
  BackendTrafficPolicy,
  ClientTrafficPolicy,
  Gateway,
  HTTPRoute,
  KubeObjectBase,
  SecurityPolicy,
} from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { makeNameColumn, namespaceColumn, ageColumn } from "../../descriptors/columnHelpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

/** Read a condition by type from an array defensively; returns undefined when absent. */
function getCondition(conditions: AnyRecord[] | undefined, type: string): { status?: string } | undefined {
  if (!Array.isArray(conditions)) return undefined;
  return conditions.find((c: AnyRecord) => c["type"] === type) as { status?: string } | undefined;
}

/** Return "True" | "False" | "Unknown" | "—" for a named condition type. */
function conditionStatus(conditions: AnyRecord[] | undefined, type: string): string {
  const cond = getCondition(conditions, type);
  if (!cond) return "—";
  return (cond.status as string | undefined) ?? "—";
}

export const gatewayColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  {
    id: "class",
    label: "Class",
    data: {
      render: ({ data }) => {
        const gw = data as Gateway;
        return (gw.spec as AnyRecord | undefined)?.["gatewayClassName"] ?? "—";
      },
    },
    cell: { baseWidth: 14 },
  },
  {
    id: "listeners",
    label: "Listeners",
    data: {
      render: ({ data }) => {
        const gw = data as Gateway;
        const listeners = (gw.spec as AnyRecord | undefined)?.["listeners"];
        return Array.isArray(listeners) ? listeners.length : 0;
      },
    },
    cell: { baseWidth: 10 },
  },
  {
    id: "status",
    label: "Status",
    data: {
      render: ({ data }) => {
        const gw = data as Gateway;
        const conditions = (gw.status as AnyRecord | undefined)?.["conditions"] as AnyRecord[] | undefined;
        const accepted = conditionStatus(conditions, "Accepted");
        const programmed = conditionStatus(conditions, "Programmed");
        const parts: string[] = [];
        if (accepted !== "—") parts.push(`Accepted: ${accepted}`);
        if (programmed !== "—") parts.push(`Programmed: ${programmed}`);
        return <TextWithTooltip text={parts.length > 0 ? parts.join(" / ") : "—"} />;
      },
    },
    cell: { baseWidth: 20 },
  },
  ageColumn,
];

export const httpRouteColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] => [
  makeNameColumn(renderName),
  namespaceColumn,
  {
    id: "hostnames",
    label: "Hostnames",
    data: {
      render: ({ data }) => {
        const route = data as HTTPRoute;
        const hostnames = (route.spec as AnyRecord | undefined)?.["hostnames"];
        const text = Array.isArray(hostnames) ? (hostnames as string[]).join(", ") : "—";
        return <TextWithTooltip text={text || "—"} />;
      },
    },
    cell: { baseWidth: 22 },
  },
  {
    id: "parents",
    label: "Parents",
    data: {
      render: ({ data }) => {
        const route = data as HTTPRoute;
        const parentRefs = (route.spec as AnyRecord | undefined)?.["parentRefs"];
        const text = Array.isArray(parentRefs)
          ? (parentRefs as AnyRecord[])
              .map((p) => (p["name"] as string | undefined) ?? "")
              .filter(Boolean)
              .join(", ")
          : "—";
        return <TextWithTooltip text={text || "—"} />;
      },
    },
    cell: { baseWidth: 16 },
  },
  {
    id: "status",
    label: "Status",
    data: {
      render: ({ data }) => {
        const route = data as HTTPRoute;
        const parents = (route.status as AnyRecord | undefined)?.["parents"] as AnyRecord[] | undefined;
        const firstParent = Array.isArray(parents) ? parents[0] : undefined;
        const conditions = firstParent?.["conditions"] as AnyRecord[] | undefined;
        const accepted = conditionStatus(conditions, "Accepted");
        const resolvedRefs = conditionStatus(conditions, "ResolvedRefs");
        const parts: string[] = [];
        if (accepted !== "—") parts.push(`Accepted: ${accepted}`);
        if (resolvedRefs !== "—") parts.push(`ResolvedRefs: ${resolvedRefs}`);
        return <TextWithTooltip text={parts.length > 0 ? parts.join(" / ") : "—"} />;
      },
    },
    cell: { baseWidth: 22 },
  },
  ageColumn,
];

function policyTargetText(data: SecurityPolicy | BackendTrafficPolicy | ClientTrafficPolicy): string {
  const spec = (data.spec as AnyRecord | undefined) ?? {};
  const targetRefs = spec["targetRefs"];
  const targetRef = spec["targetRef"];
  const first = (Array.isArray(targetRefs) ? targetRefs[0] : undefined) ?? targetRef;
  if (!first) return "—";
  const kind = (first["kind"] as string | undefined) ?? "";
  const name = (first["name"] as string | undefined) ?? "";
  if (!kind && !name) return "—";
  if (!kind) return name;
  if (!name) return kind;
  return `${kind}/${name}`;
}

function policyAcceptedStatus(data: SecurityPolicy | BackendTrafficPolicy | ClientTrafficPolicy): string {
  const status = (data.status as AnyRecord | undefined) ?? {};
  const ancestors = status["ancestors"] as AnyRecord[] | undefined;
  if (!Array.isArray(ancestors) || ancestors.length === 0) return "—";
  const conditions = ancestors[0]["conditions"] as AnyRecord[] | undefined;
  return conditionStatus(conditions, "Accepted");
}

function makePolicyColumns(renderName: RenderName): TableColumn<KubeObjectBase>[] {
  return [
    makeNameColumn(renderName),
    namespaceColumn,
    {
      id: "target",
      label: "Target",
      data: {
        render: ({ data }) => (
          <TextWithTooltip
            text={policyTargetText(data as SecurityPolicy | BackendTrafficPolicy | ClientTrafficPolicy)}
          />
        ),
      },
      cell: { baseWidth: 18 },
    },
    {
      id: "status",
      label: "Status",
      data: {
        render: ({ data }) => {
          const accepted = policyAcceptedStatus(data as SecurityPolicy | BackendTrafficPolicy | ClientTrafficPolicy);
          return <TextWithTooltip text={accepted !== "—" ? `Accepted: ${accepted}` : "—"} />;
        },
      },
      cell: { baseWidth: 16 },
    },
    ageColumn,
  ];
}

export const securityPolicyColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] =>
  makePolicyColumns(renderName);

export const backendTrafficPolicyColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] =>
  makePolicyColumns(renderName);

export const clientTrafficPolicyColumns = (renderName: RenderName): TableColumn<KubeObjectBase>[] =>
  makePolicyColumns(renderName);
