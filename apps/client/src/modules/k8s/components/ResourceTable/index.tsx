import { useCallback, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Box, Trash } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { DataTable } from "@/core/components/Table";
import { EmptyList } from "@/core/components/EmptyList";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { useClusterStore } from "@/k8s/store";
import {
  PATH_K8S_DETAIL_CLUSTER_FULL,
  PATH_K8S_DETAIL_NS_FULL,
  PATH_K8S_CR_DETAIL_CLUSTER_FULL,
  PATH_K8S_CR_DETAIL_NS_FULL,
} from "../../constants/paths";
import type { TableProps } from "@/core/components/Table/types";
import type { KubeObjectBase } from "@my-project/shared";
import type { ResourceDescriptor } from "../../registry/types";
import { BatchDeleteDialog } from "../BatchDeleteDialog";

interface Props<T extends KubeObjectBase> {
  items: T[];
  descriptor: ResourceDescriptor;
  isLoading: boolean;
  error: Error | null;
  tableId?: string;
  namespace?: string;
  filterFunction?: (item: KubeObjectBase) => boolean;
  slots?: TableProps<KubeObjectBase>["slots"];
}

function NameLink({
  item,
  descriptor,
  clusterName,
}: {
  item: KubeObjectBase;
  descriptor: ResourceDescriptor;
  clusterName: string;
}) {
  const name = item.metadata?.name ?? "";
  const namespace = item.metadata?.namespace ?? "";

  // Custom Resources use dedicated CR detail routes that carry group/version/plural.
  if (descriptor.customResource) {
    const { group, version, pluralName } = descriptor.config;
    if (!group || !version || !pluralName) {
      throw new Error(
        `ResourceDescriptor with customResource=true must have non-empty group, version, and pluralName (kind: ${descriptor.config.kind})`
      );
    }

    if (descriptor.detailVariant === "cluster") {
      return (
        <Button variant="link" asChild className="w-full justify-start p-0">
          <Link
            to={PATH_K8S_CR_DETAIL_CLUSTER_FULL}
            params={{ clusterName, group, version, plural: pluralName, name } as never}
          >
            <TextWithTooltip text={name || "—"} />
          </Link>
        </Button>
      );
    }

    if (!namespace) {
      return (
        <span className="text-sm">
          <TextWithTooltip text={name || "—"} />
        </span>
      );
    }

    return (
      <Button variant="link" asChild className="w-full justify-start p-0">
        <Link
          to={PATH_K8S_CR_DETAIL_NS_FULL}
          params={{ clusterName, group, version, plural: pluralName, namespace, name } as never}
        >
          <TextWithTooltip text={name || "—"} />
        </Link>
      </Button>
    );
  }

  if (descriptor.detailVariant === "cluster") {
    return (
      <Button variant="link" asChild className="w-full justify-start p-0">
        <Link to={PATH_K8S_DETAIL_CLUSTER_FULL} params={{ clusterName, kind: descriptor.config.pluralName, name }}>
          <TextWithTooltip text={name || "—"} />
        </Link>
      </Button>
    );
  }

  if (!namespace) {
    return (
      <span className="text-sm">
        <TextWithTooltip text={name || "—"} />
      </span>
    );
  }

  return (
    <Button variant="link" asChild className="w-full justify-start p-0">
      <Link to={PATH_K8S_DETAIL_NS_FULL} params={{ clusterName, kind: descriptor.config.pluralName, namespace, name }}>
        <TextWithTooltip text={name || "—"} />
      </Link>
    </Button>
  );
}

export function ResourceTable<T extends KubeObjectBase>({
  items,
  descriptor,
  isLoading,
  error,
  tableId,
  namespace,
  filterFunction,
  slots,
}: Props<T>) {
  const clusterName = useClusterStore((s) => s.clusterName) ?? "";
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const columns = useMemo(
    () => descriptor.columns((data) => <NameLink item={data} descriptor={descriptor} clusterName={clusterName} />),
    [descriptor, clusterName]
  );

  const isRowSelected = useCallback((item: KubeObjectBase) => selected.has(item.metadata?.uid ?? ""), [selected]);

  const handleSelectRow = useCallback((_e: React.MouseEvent<HTMLButtonElement>, item: KubeObjectBase) => {
    const uid = item.metadata?.uid ?? "";
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((_e: React.ChangeEvent<HTMLInputElement>, paginatedItems: KubeObjectBase[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = paginatedItems.every((i) => next.has(i.metadata?.uid ?? ""));
      if (allSelected) {
        paginatedItems.forEach((i) => next.delete(i.metadata?.uid ?? ""));
      } else {
        paginatedItems.forEach((i) => next.add(i.metadata?.uid ?? ""));
      }
      return next;
    });
  }, []);

  const selectedUids = useMemo(() => Array.from(selected), [selected]);

  const selectedItems = useMemo(
    () => (items as KubeObjectBase[]).filter((i) => selected.has(i.metadata?.uid ?? "")),
    [items, selected]
  );

  const renderSelectionInfo = useCallback(
    (selectionLength: number) => (
      <div className="flex items-center gap-2">
        <div className="min-w-38">
          <p>{selectionLength} item(s) selected</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)}>
          <Trash size={14} className="mr-1.5" /> Delete {selectionLength}
        </Button>
      </div>
    ),
    []
  );

  const emptyDescription = descriptor.config.clusterScoped
    ? `There are no ${descriptor.label} in the cluster`
    : namespace
      ? `There are no ${descriptor.label} in namespace ${namespace}`
      : `There are no ${descriptor.label}`;

  return (
    <>
      <DataTable<KubeObjectBase>
        id={tableId ?? `k8s-${descriptor.config.pluralName}`}
        data={items as KubeObjectBase[]}
        columns={columns}
        isLoading={isLoading}
        blockerError={error}
        filterFunction={filterFunction}
        slots={slots}
        sort={
          descriptor.defaultSort
            ? {
                order: descriptor.defaultSort.order,
                sortBy: descriptor.defaultSort.sortBy,
              }
            : undefined
        }
        selection={{
          selected: selectedUids,
          isRowSelected,
          handleSelectRow,
          handleSelectAll,
          renderSelectionInfo,
        }}
        emptyListComponent={
          <EmptyList
            icon={<Box width={64} height={64} className="text-muted-foreground" />}
            customText={`No ${descriptor.label} found`}
            description={emptyDescription}
          />
        }
      />
      {/* Mounted outside DataTable: the selection banner unmounts as soon as the
          watch stream drains selected items from the data, which would otherwise
          kill an in-flight deletion dialog. */}
      {deleteDialogOpen && (
        <BatchDeleteDialog
          items={selectedItems}
          config={descriptor.config}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onDeleted={() => setSelected(new Set())}
        />
      )}
    </>
  );
}
