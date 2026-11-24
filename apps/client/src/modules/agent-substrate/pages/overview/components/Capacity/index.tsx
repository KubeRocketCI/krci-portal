import React from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import type { ReadyFleetSnapshot, RoomSize, WorkerPoolAccess, WorkerPoolRow } from "@my-project/shared";
import { SectionHeading } from "@/core/components/SectionHeading";
import { CellLink } from "@/core/components/Table/components/CellLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { cn } from "@/core/utils/classname";
import { useClusterStore } from "@/k8s/store";
import { ResourceBars } from "../../../../components/ResourceBars";
import { PATH_AGENT_WORKER_POOLS_FULL } from "../../../../constants/paths";
import { workerPoolAnchor } from "../../../../utils/rowAnchor";
import { replicasText, roomBasisText, roomVerdict } from "../../utils/capacity";

interface WorkerPoolCapacityProps {
  pool: WorkerPoolRow;
  roomSize: RoomSize | null;
  access: WorkerPoolAccess;
  clusterName: string;
}

/** Verdict and bars come from the workers: shown also when the WorkerPool list was not read. */
function WorkerPoolCapacity({ pool, roomSize, access, clusterName }: WorkerPoolCapacityProps) {
  const verdict = roomVerdict(pool.room, pool.limitedBy);
  const VerdictIcon = verdict.hasRoom ? CircleCheck : CircleAlert;
  const notReady = pool.resource !== null && pool.resource.readyReplicas < pool.resource.desiredReplicas;

  return (
    <Card role="region" aria-label={`Worker pool ${pool.namespace}/${pool.name}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 p-4 pb-2">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="min-w-0 text-sm font-semibold">
            <CellLink
              to={PATH_AGENT_WORKER_POOLS_FULL}
              params={{ clusterName }}
              hash={workerPoolAnchor(pool)}
              text={pool.name}
            />
          </CardTitle>
          <span className="text-muted-foreground text-xs">{pool.namespace}</span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5 text-xs">
          <span className="text-muted-foreground">Replicas</span>
          <span
            className={cn(
              "tabular-nums",
              !pool.resource && "text-muted-foreground",
              notReady && "text-status-error font-medium"
            )}
          >
            {replicasText(pool.resource, access)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4 pt-0">
        <div className="flex flex-col gap-0.5">
          <p
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              verdict.hasRoom ? "text-status-success" : "text-status-error"
            )}
          >
            <VerdictIcon className="size-4 shrink-0" aria-hidden />
            {verdict.text}
          </p>
          <p className="text-muted-foreground text-xs">{roomBasisText(roomSize, pool.limitedBy)}</p>
        </div>
        <ResourceBars capacity={pool.capacity} allocated={pool.allocated} showPercent />
      </CardContent>
    </Card>
  );
}

/** One card per worker pool. With no worker pool, nothing: At a glance shows room 0 across 0 worker pools. */
export function Capacity({ fleet }: { fleet: ReadyFleetSnapshot }) {
  const headingId = React.useId();
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const { access, items, roomSize } = fleet.workerPools;

  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId}>
      <SectionHeading id={headingId}>Capacity</SectionHeading>
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((pool) => (
          <WorkerPoolCapacity
            key={`${pool.namespace}/${pool.name}`}
            pool={pool}
            roomSize={roomSize}
            access={access}
            clusterName={clusterName}
          />
        ))}
      </div>
    </section>
  );
}
