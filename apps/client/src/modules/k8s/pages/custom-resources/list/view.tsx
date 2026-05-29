import { useEffect, useMemo, useRef } from "react";
import { Puzzle } from "lucide-react";
import { useParams, useSearch } from "@tanstack/react-router";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { FilterProvider } from "@/core/providers/Filter";
import { ResourceTable } from "@/modules/k8s/components/ResourceTable";
import { useCRDByGVR } from "@/modules/k8s/hooks/useCRDByGVR";
import { useCRList } from "@/modules/k8s/hooks/useCRList";
import { buildCRDescriptor } from "@/modules/k8s/registry/dynamic/buildCRDescriptor";
import { resolveCRDVersion, CREATION_TIMESTAMP_PRINTER_COL_PATH } from "@/modules/k8s/registry/dynamic/crdUtils";
import { extractByJsonPath } from "@/modules/k8s/utils/extractByJsonPath";
import { useClusterStore } from "@/k8s/store";
import type { KubeObjectBase } from "@my-project/shared";
import { CRListFilter } from "./components/CRListFilter";
import {
  buildCRListDefaultValues,
  buildCRListMatchFunctions,
  type PrinterColMeta,
} from "./components/CRListFilter/constants";
import { useCRListFilter } from "./components/CRListFilter/hooks/useCRListFilter";

type Params = { clusterName: string; group: string; version: string; plural: string };
type Search = { namespace?: string; search?: string };

export default function CRListView() {
  const { group, version, plural } = useParams({ strict: false }) as Partial<Params>;
  const search = useSearch({ strict: false }) as Search;
  const storedNs = useClusterStore((s) => s.defaultNamespace);

  const { crd, isLoading, error } = useCRDByGVR(group ?? "", version ?? "", plural ?? "");

  if (isLoading) {
    return (
      <PageWrapper breadcrumbs={[{ label: "Cluster" }, { label: "Custom Resources" }]}>
        <PageContentWrapper icon={Puzzle} title="Loading…">
          <div className="text-muted-foreground p-6 text-sm">Loading CRD…</div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  if (error || !crd) {
    return (
      <PageWrapper breadcrumbs={[{ label: "Cluster" }, { label: "Custom Resources" }]}>
        <PageContentWrapper icon={Puzzle} title="Unknown custom resource">
          <div className="p-6">
            Unknown custom resource: <code>{`${group}/${version}/${plural}`}</code>.
          </div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  // Key on the CRD's identity so navigating between two CR list pages (e.g.
  // pipelineruns → applications) remounts CRListInner — otherwise the
  // `frozenAutoColsRef` inside would survive the navigation and the new CRD
  // would inherit the previous CRD's filter columns and match functions.
  const innerKey = `${crd.spec.group}/${crd.spec.names.plural}`;
  return <CRListInner key={innerKey} crd={crd} version={version ?? ""} storedNs={storedNs ?? ""} search={search} />;
}

function CRListInner({
  crd,
  version,
  storedNs,
  search,
}: {
  crd: NonNullable<ReturnType<typeof useCRDByGVR>["crd"]>;
  version: string;
  storedNs: string;
  search: Search;
}) {
  const descriptor = useMemo(() => buildCRDescriptor(crd, version), [crd, version]);
  const namespace = !descriptor.config.clusterScoped ? (search.namespace ?? storedNs ?? "") : "";

  const watch = useCRList(crd, namespace, version);

  // Auto multi-select discovery from the FIRST non-empty watch snapshot.
  // Cache the result in a ref so later watch ticks (new items arriving via WebSocket)
  // do not recompute the option set — recomputation would churn FilterProvider and
  // could surface/hide columns as the distinct-value threshold (≤8) is crossed,
  // creating a flickering filter UI. MVP trade-off; live-update would require
  // lifting FilterProvider into a reactive recompute.
  //
  // The ref is only frozen once `items.length > 0`. If the first snapshot is empty
  // (e.g. namespace not yet selected), `frozenAutoColsRef.current` stays null and the
  // memo re-runs on the next tick once items arrive, avoiding permanently-empty filters.
  const frozenAutoColsRef = useRef<PrinterColMeta[] | null>(null);

  // Reset the frozen columns whenever the namespace changes so the new namespace's
  // distinct values are used to build the filter dropdowns. Without this the ref
  // would hold the previous namespace's frozen result until the component remounts.
  useEffect(() => {
    frozenAutoColsRef.current = null;
  }, [namespace]);

  // `watch.data` is intentionally a dep here: we need the memo to re-run when
  // `data.array.length` transitions from 0 → nonzero so the filter columns are
  // derived from actual item values rather than an empty set.
  const watchDataLength = watch.isReady ? (watch.data.array as KubeObjectBase[]).length : 0;
  const autoMultiSelectCols = useMemo<PrinterColMeta[]>(() => {
    if (frozenAutoColsRef.current !== null) return frozenAutoColsRef.current;
    if (!watch.isReady) return [];
    const items = watch.data.array as KubeObjectBase[];
    // Do not freeze yet when the snapshot is empty — wait for the first non-empty tick.
    if (items.length === 0) return [];
    const resolvedVersion = resolveCRDVersion(crd, version);
    const printerCols = resolvedVersion?.additionalPrinterColumns ?? [];
    const priorityZero = printerCols.filter(
      (c) => (c.priority ?? 0) === 0 && c.jsonPath !== CREATION_TIMESTAMP_PRINTER_COL_PATH
    );
    const result = priorityZero.filter((c) => {
      if (c.type !== "string") return false;
      const distinct = new Set(items.map((it) => extractByJsonPath(it, c.jsonPath)).filter((v) => v != null));
      return distinct.size > 0 && distinct.size <= 8;
    });
    frozenAutoColsRef.current = result;
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch.isReady, watchDataLength, crd, version]);

  // Memoize so WebSocket watch ticks don't churn FilterProvider's internal memo/effect
  // (otherwise URL-sync fires spuriously on every list update).
  const defaultValues = useMemo(
    () => buildCRListDefaultValues(autoMultiSelectCols, search.search ?? ""),
    [autoMultiSelectCols, search.search]
  );

  const matchFunctions = useMemo(() => buildCRListMatchFunctions(autoMultiSelectCols), [autoMultiSelectCols]);

  if (!watch.isReady) {
    return (
      <PageWrapper breadcrumbs={[{ label: "Cluster" }, { label: "Custom Resources" }, { label: descriptor.label }]}>
        <PageContentWrapper icon={Puzzle} title={descriptor.label}>
          <div className="text-muted-foreground p-6 text-sm">Loading…</div>
        </PageContentWrapper>
      </PageWrapper>
    );
  }

  const items = watch.data.array as KubeObjectBase[];

  return (
    <FilterProvider defaultValues={defaultValues} matchFunctions={matchFunctions} syncWithUrl>
      <CRListContent
        descriptor={descriptor}
        items={items}
        printerCols={autoMultiSelectCols}
        watchError={watch.error}
        namespace={namespace}
      />
    </FilterProvider>
  );
}

function CRListContent({
  descriptor,
  items,
  printerCols,
  watchError,
  namespace,
}: {
  descriptor: ReturnType<typeof buildCRDescriptor>;
  items: KubeObjectBase[];
  printerCols: PrinterColMeta[];
  watchError: unknown;
  namespace: string;
}) {
  const { filterFunction } = useCRListFilter();

  const tableSlots = useMemo(
    () => ({
      header: {
        component: <CRListFilter items={items} printerCols={printerCols} />,
      },
    }),
    [items, printerCols]
  );

  return (
    <PageWrapper breadcrumbs={[{ label: "Cluster" }, { label: "Custom Resources" }, { label: descriptor.label }]}>
      <PageContentWrapper icon={Puzzle} title={descriptor.label}>
        <ResourceTable
          items={items}
          descriptor={descriptor}
          isLoading={false}
          error={(watchError as Error) ?? null}
          namespace={namespace}
          filterFunction={filterFunction}
          slots={tableSlots}
        />
      </PageContentWrapper>
    </PageWrapper>
  );
}
