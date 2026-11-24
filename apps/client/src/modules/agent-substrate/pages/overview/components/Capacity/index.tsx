import React from "react";
import { useShallow } from "zustand/react/shallow";
import type { ReadyFleet, WorkerPoolAccess, WorkerPoolRow } from "@my-project/shared";
import { SectionHeading } from "@/core/components/SectionHeading";
import { CellLink } from "@/core/components/Table/components/CellLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { cn } from "@/core/utils/classname";
import { useClusterStore } from "@/k8s/store";
import { TermLabel } from "../../../../components/KV";
import { ResourceBars } from "../../../../components/ResourceBars";
import { RoomVerdict } from "../../../../components/RoomVerdict";
import { SECTION_HINT, TERM_HINT } from "../../../../constants/hints";
import { PATH_AGENT_WORKER_POOLS_FULL } from "../../../../constants/paths";
import { showsActorsBar } from "../../../../utils/actorsBar";
import { fleetRoom } from "../../../../utils/roomLabel";
import { workerPoolAnchor } from "../../../../utils/rowAnchor";
import { replicasText } from "../../utils/capacity";

interface WorkerPoolCapacityProps {
  workerPool: WorkerPoolRow;
  totalRoom: number;
  access: WorkerPoolAccess;
  clusterName: string;
}

/** Verdict and bars come from the workers: shown also when the WorkerPool list was not read. */
function WorkerPoolCapacity({ workerPool, totalRoom, access, clusterName }: WorkerPoolCapacityProps) {
  const { resource } = workerPool;
  const notReady = resource !== null && resource.readyReplicas < resource.desiredReplicas;

  return (
    <Card role="region" aria-label={`Worker pool ${workerPool.namespace}/${workerPool.name}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 p-4 pb-2">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="min-w-0 text-sm font-semibold">
            <CellLink
              to={PATH_AGENT_WORKER_POOLS_FULL}
              params={{ clusterName }}
              hash={workerPoolAnchor(workerPool)}
              text={workerPool.name}
            />
          </CardTitle>
          <span className="text-muted-foreground text-xs">{workerPool.namespace}</span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5 text-xs">
          <span className="text-muted-foreground">
            <TermLabel label="Replicas" hint={TERM_HINT.replicas} />
          </span>
          <span
            className={cn(
              "tabular-nums",
              !resource && "text-muted-foreground",
              notReady && "text-status-error font-medium"
            )}
          >
            {replicasText(resource, access)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4 pt-0">
        <RoomVerdict workerPool={workerPool} totalRoom={totalRoom} />
        <ResourceBars
          capacity={workerPool.capacity}
          allocated={workerPool.allocated}
          showPercent
          actorsBar={showsActorsBar(workerPool)}
        />
      </CardContent>
    </Card>
  );
}

/** Renders nothing with no worker pool; At a glance shows room 0. */
export function Capacity({ fleet }: { fleet: ReadyFleet }) {
  const headingId = React.useId();
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const { access, items } = fleet.workerPools;
  const totalRoom = fleetRoom(fleet.workerPools);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId}>
      <SectionHeading id={headingId} hint={SECTION_HINT.capacity}>
        Capacity
      </SectionHeading>
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((workerPool) => (
          <WorkerPoolCapacity
            key={`${workerPool.namespace}/${workerPool.name}`}
            workerPool={workerPool}
            totalRoom={totalRoom}
            access={access}
            clusterName={clusterName}
          />
        ))}
      </div>
    </section>
  );
}
