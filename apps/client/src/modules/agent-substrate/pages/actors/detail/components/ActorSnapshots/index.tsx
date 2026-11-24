import type { ActorSnapshot } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import type { TableColumn } from "@/core/components/Table/types";
import { TABLE } from "@/k8s/constants/tables";
import { SnapshotDurableStateBadge, SnapshotFidelityBadge } from "../../../../../components/ActorCells";
import { TERM_HINT } from "../../../../../constants/hints";

const DEFAULT_SORT = { sortBy: "generation", order: "desc" } as const;

const EMPTY_LIST = <EmptyList customText="The actor has no snapshots" />;

const columns: TableColumn<ActorSnapshot>[] = [
  {
    id: "generation",
    label: "Generation",
    hint: TERM_HINT.generation,
    data: { columnSortableValuePath: "generation", render: ({ data }) => data.generation },
    cell: { baseWidth: 10 },
  },
  {
    id: "fidelity",
    label: "Fidelity",
    hint: TERM_HINT.fidelity,
    data: {
      columnSortableValuePath: "fidelity",
      render: ({ data }) => <SnapshotFidelityBadge snapshot={data} />,
    },
    cell: { baseWidth: 10 },
  },
  {
    id: "locality",
    label: "Locality",
    hint: TERM_HINT.locality,
    data: {
      columnSortableValuePath: "locality",
      render: ({ data }) => data.locality ?? <span className="text-muted-foreground">No node</span>,
    },
    cell: { baseWidth: 15 },
  },
  {
    id: "durableState",
    label: "Durable state",
    hint: TERM_HINT.durableState,
    data: {
      columnSortableValuePath: "durableState",
      render: ({ data }) => <SnapshotDurableStateBadge snapshot={data} />,
    },
    cell: { baseWidth: 10 },
  },
  {
    id: "uuid",
    label: "UUID",
    data: { render: ({ data }) => <span className="font-mono text-xs">{data.uuid}</span> },
    cell: { baseWidth: 20 },
  },
];

export function ActorSnapshots({ snapshots }: { snapshots: ActorSnapshot[] }) {
  return (
    <DataTable<ActorSnapshot>
      id={TABLE.AGENT_ACTOR_SNAPSHOT_LIST.id}
      name={TABLE.AGENT_ACTOR_SNAPSHOT_LIST.name}
      data={snapshots}
      columns={columns}
      sort={DEFAULT_SORT}
      emptyListComponent={EMPTY_LIST}
    />
  );
}
