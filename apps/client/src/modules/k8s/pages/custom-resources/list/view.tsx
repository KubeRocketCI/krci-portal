import { useEffect, useMemo, useRef } from "react";
import { Puzzle } from "lucide-react";
import { useParams, useSearch } from "@tanstack/react-router";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { FilterProvider } from "@/core/providers/Filter";
import { ResourceTable } from "@/modules/k8s/components/ResourceTable";
import { useCRDByGVR } from "@/modules/k8s/hooks/useCRDByGVR";
import { useCRListMulti } from "@/modules/k8s/hooks/useCRList";
import { resolveListNamespaces } from "@/modules/k8s/utils/resolveListNamespaces";
import { formatK8sErrors } from "@/modules/k8s/utils/formatK8sErrors";
import { buildCRDescriptor } from "@/modules/k8s/registry/dynamic/buildCRDescriptor";
import { resolveCRDVersion, CREATION_TIMESTAMP_PRINTER_COL_PATH } from "@/modules/k8s/registry/dynamic/crdUtils";
import { extractByJsonPath } from "@/modules/k8s/utils/extractByJsonPath";
import type { RequestError } from "@/core/types/global";
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

  // Remount CRListInner per CRD so its `frozenAutoColsRef` doesn't leak the
  // previous CRD's filter columns when navigating between two CR list pages.
  const innerKey = `${crd.spec.group}/${crd.spec.names.plural}`;
  return <CRListInner key={innerKey} crd={crd} version={version ?? ""} search={search} />;
}

function CRListInner({
  crd,
  version,
  search,
}: {
  crd: NonNullable<ReturnType<typeof useCRDByGVR>["crd"]>;
  version: string;
  search: Search;
}) {
  const descriptor = useMemo(() => buildCRDescriptor(crd, version), [crd, version]);

  const namespaces = useMemo(() => resolveListNamespaces({ urlNamespace: search.namespace }), [search.namespace]);

  const watch = useCRListMulti(crd, namespaces, version);

  // Discover the multi-select filter columns once, from the first non-empty watch
  // snapshot, and freeze them in a ref. Recomputing on later watch ticks would
  // churn FilterProvider and flicker columns as the distinct-value threshold is
  // crossed. Stays null while empty so it re-runs once items arrive.
  const frozenAutoColsRef = useRef<PrinterColMeta[] | null>(null);

  // Rebuild the columns from fresh data when the deep-linked namespace changes.
  useEffect(() => {
    frozenAutoColsRef.current = null;
  }, [search.namespace]);

  // Dep on the item count so the memo re-runs when the list goes 0 → nonzero.
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

  // Memoize so watch ticks don't churn FilterProvider and fire URL-sync spuriously.
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
        watchErrors={watch.errors}
        namespace={search.namespace}
      />
    </FilterProvider>
  );
}

function CRListContent({
  descriptor,
  items,
  printerCols,
  watchErrors,
  namespace,
}: {
  descriptor: ReturnType<typeof buildCRDescriptor>;
  items: KubeObjectBase[];
  printerCols: PrinterColMeta[];
  watchErrors: RequestError[];
  namespace?: string;
}) {
  const { filterFunction } = useCRListFilter();

  const errors = useMemo(() => formatK8sErrors(watchErrors), [watchErrors]);

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
          errors={errors}
          namespace={namespace}
          filterFunction={filterFunction}
          slots={tableSlots}
        />
      </PageContentWrapper>
    </PageWrapper>
  );
}
