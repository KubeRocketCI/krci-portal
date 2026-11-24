import React from "react";
import type {
  ActorRow,
  ReadyFleetSnapshot,
  RoomSize,
  WorkerPoolAccess,
  WorkerPoolRow,
  WorkerRow,
} from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { cn } from "@/core/utils/classname";
import { ActorLink, ActorStateBadge } from "../../../../components/ActorCells";
import { FleetEmpty } from "../../../../components/FleetStatePanel";
import { ResourceBars } from "../../../../components/ResourceBars";
import { WorkerNotRegisteredBadge, WorkerPoolReadyBadge, WorkerStateBadge } from "../../../../components/WorkerCells";
import { WorkerPoolAccessNotice } from "../../../../components/WorkerPoolAccessNotice";
import { useScrollToHashTarget } from "../../../../hooks/useScrollToHashTarget";
import { hasNoWorkerFleet } from "../../../../utils/hasNoWorkerFleet";
import { roomLabel } from "../../../../utils/roomLabel";
import { HASH_TARGET_CLASS, workerAnchor } from "../../../../utils/rowAnchor";

interface WorkerBlockProps {
  worker: WorkerRow;
  actors: ActorRow[];
  /** The URL fragment names this worker. */
  isTarget: boolean;
}

function WorkerBlock({ worker, actors, isTarget }: WorkerBlockProps) {
  return (
    <section
      id={workerAnchor(worker)}
      aria-label={`Worker ${worker.pod}`}
      aria-current={isTarget ? "true" : undefined}
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-3",
        (worker.state !== "active" || !worker.registered) && "border-status-missing/50 border-dashed",
        isTarget && HASH_TARGET_CLASS
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-mono text-xs">{worker.pod}</span>
        <span className="text-muted-foreground text-xs">
          {worker.node}
          {worker.sandboxClasses.length > 0 && ` · ${worker.sandboxClasses.join(", ")}`}
        </span>
        <span className="flex items-center gap-1">
          {!worker.registered && <WorkerNotRegisteredBadge />}
          <WorkerStateBadge state={worker.state} />
        </span>
      </div>
      <ResourceBars capacity={worker.capacity} allocated={worker.allocated} />
      {actors.length > 0 ? (
        <ul className="grid gap-2 md:grid-cols-2">
          {actors.map((actor) => (
            <li
              key={actor.uid || `${actor.atespace}/${actor.name}`}
              className="bg-background flex items-center justify-between gap-2 rounded-md border p-2 text-xs"
            >
              <div className="min-w-0 flex-1">
                <ActorLink actor={actor} />
              </div>
              <div className="shrink-0">
                <ActorStateBadge state={actor.state} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-muted-foreground text-xs">No actor on this worker</div>
      )}
    </section>
  );
}

function WorkerPoolFacts({ pool, access }: { pool: WorkerPoolRow; access: WorkerPoolAccess }) {
  if (pool.resource) {
    return (
      <div className="flex flex-col items-end gap-1">
        <WorkerPoolReadyBadge resource={pool.resource} />
        {pool.resource.sandboxClass && (
          <span className="text-muted-foreground text-xs">{pool.resource.sandboxClass}</span>
        )}
      </div>
    );
  }
  return (
    <span className="text-muted-foreground text-xs">
      {access === "ok" ? "No WorkerPool resource" : "WorkerPool not readable"}
    </span>
  );
}

/** Worker names are unique only within a worker pool. */
const workerKey = (namespace: string, workerPool: string, worker: string) =>
  JSON.stringify([namespace, workerPool, worker]);

interface WorkerPoolCardProps {
  pool: WorkerPoolRow;
  roomSize: RoomSize | null;
  access: WorkerPoolAccess;
  workersByKey: Map<string, WorkerRow>;
  actorsByWorker: Map<string, ActorRow[]>;
  target: string | null;
}

function WorkerPoolCard({ pool, roomSize, access, workersByKey, actorsByWorker, target }: WorkerPoolCardProps) {
  return (
    <Card role="region" aria-label={`Worker pool ${pool.namespace}/${pool.name}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="text-base">Worker pool {pool.name}</CardTitle>
          <div className="text-muted-foreground text-xs">
            {pool.namespace} · {roomLabel(pool.room, roomSize)}
          </div>
        </div>
        <WorkerPoolFacts pool={pool} access={access} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ResourceBars capacity={pool.capacity} allocated={pool.allocated} />
        {pool.workers.length === 0 && (
          <div className="text-muted-foreground text-xs">No worker in this worker pool</div>
        )}
        {pool.workers.flatMap((name) => {
          const key = workerKey(pool.namespace, pool.name, name);
          const worker = workersByKey.get(key);
          if (!worker) return [];
          return [
            <WorkerBlock
              key={name}
              worker={worker}
              actors={actorsByWorker.get(key) ?? []}
              isTarget={workerAnchor(worker) === target}
            />,
          ];
        })}
      </CardContent>
    </Card>
  );
}

/** The worker that the URL fragment names is scrolled into view and highlighted. */
export function CapacityBoard({ fleet }: { fleet: ReadyFleetSnapshot }) {
  const target = useScrollToHashTarget(fleet.workers);

  const workersByKey = React.useMemo(
    () =>
      new Map(
        fleet.workers.map((worker) => [workerKey(worker.workerNamespace, worker.workerPool, worker.name), worker])
      ),
    [fleet.workers]
  );

  const actorsByWorker = React.useMemo(() => {
    const byWorker = new Map<string, ActorRow[]>();
    for (const actor of fleet.actors) {
      if (!actor.placement) continue;
      const { workerNamespace, workerPool, worker } = actor.placement;
      const key = workerKey(workerNamespace, workerPool, worker);
      const actors = byWorker.get(key);
      if (actors) actors.push(actor);
      else byWorker.set(key, [actor]);
    }
    return byWorker;
  }, [fleet.actors]);

  if (hasNoWorkerFleet(fleet)) return <FleetEmpty />;

  return (
    <>
      <WorkerPoolAccessNotice access={fleet.workerPools.access} />
      {fleet.workerPools.items.length === 0 && <EmptyList customText="No workers" />}
      <div className="grid gap-6 xl:grid-cols-2">
        {fleet.workerPools.items.map((pool) => (
          <WorkerPoolCard
            key={`${pool.namespace}/${pool.name}`}
            pool={pool}
            roomSize={fleet.workerPools.roomSize}
            access={fleet.workerPools.access}
            workersByKey={workersByKey}
            actorsByWorker={actorsByWorker}
            target={target}
          />
        ))}
      </div>
    </>
  );
}
