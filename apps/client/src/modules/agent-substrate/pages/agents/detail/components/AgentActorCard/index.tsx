import { useShallow } from "zustand/react/shallow";
import type { AgentActor, WorkerPoolRef } from "@my-project/shared";
import { CellLink } from "@/core/components/Table/components/CellLink";
import { Alert } from "@/core/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { formatTimestamp } from "@/core/utils/date-humanize";
import { useClusterStore } from "@/k8s/store";
import { ActorLink } from "../../../../../components/ActorCells";
import { EmptyValue } from "../../../../../components/EmptyValue";
import { KV } from "../../../../../components/KV";
import { TERM_HINT } from "../../../../../constants/hints";
import { PATH_FACTORY_WORKER_POOLS_FULL } from "../../../../../constants/paths";
import { sizeText, workerPoolText, workerSelectorText } from "../../../../../utils/roomLabel";
import { workerPoolAnchor } from "../../../../../utils/rowAnchor";

const TITLE_ID = "agent-actor-title";

const NOT_ON_A_WORKER = "Not on a worker";

const NO_WORKER_POOL = "No worker pool";

function WorkerPoolLink({ workerPool }: { workerPool: WorkerPoolRef }) {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  return (
    <CellLink
      to={PATH_FACTORY_WORKER_POOLS_FULL}
      params={{ clusterName }}
      hash={workerPoolAnchor(workerPool)}
      text={workerPoolText(workerPool)}
      className="w-auto"
    />
  );
}

function WorkerPoolLinks({ workerPools }: { workerPools: WorkerPoolRef[] | null }) {
  if (workerPools === null) return <EmptyValue />;
  if (workerPools.length === 0) return <span className="text-muted-foreground">{NO_WORKER_POOL}</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      {workerPools.map((workerPool) => (
        <WorkerPoolLink key={workerPoolText(workerPool)} workerPool={workerPool} />
      ))}
    </span>
  );
}

/** `placement` is null while the actor is not running. */
function WorkerText({ placement }: Pick<AgentActor, "placement">) {
  if (!placement) return <span className="text-muted-foreground">{NOT_ON_A_WORKER}</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <WorkerPoolLink workerPool={{ namespace: placement.workerNamespace, name: placement.workerPool }} />
      <span>
        <span className="text-muted-foreground">pod </span>
        <span className="font-mono text-xs">{placement.workerPod}</span>
      </span>
      <span>
        <span className="text-muted-foreground">node </span>
        <span className="font-mono text-xs">{placement.node}</span>
      </span>
    </span>
  );
}

function snapshotFidelityText({ preferredSnapshotFidelity, newestSnapshot }: AgentActor): string {
  const preferred = preferredSnapshotFidelity ?? "not set";
  const newest = newestSnapshot ? newestSnapshot.fidelity : "no snapshot yet";
  return `preferred ${preferred} · newest ${newest}`;
}

interface AgentActorCardProps {
  actor: AgentActor;
  /** From the fleet read. Null while it is not ready or holds no row of the actor; empty: no worker pool. */
  usableWorkerPools: WorkerPoolRef[] | null;
}

/** Sandbox class: of the worker assignment while running, else of the newest snapshot. */
export function AgentActorCard({ actor, usableWorkerPools }: AgentActorCardProps) {
  const sandboxClass = actor.placement?.sandboxRuntime ?? actor.newestSnapshot?.sandboxClass;

  return (
    <Card role="region" aria-labelledby={TITLE_ID}>
      <CardHeader className="p-4 pb-2">
        <CardTitle id={TITLE_ID} className="text-sm font-semibold">
          Actor
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4 pt-0">
        {actor.crash && (
          <Alert variant="destructive" title="Actor crashed">
            <p className="break-all">{actor.crash.message}</p>
            {actor.crash.at && <p className="text-xs">Crashed at {formatTimestamp(actor.crash.at)}</p>}
          </Alert>
        )}
        <KV
          rows={[
            ["Actor", <ActorLink actor={actor} />],
            ["Atespace", actor.atespace, TERM_HINT.atespace],
            ["Actor template", actor.actorTemplate, TERM_HINT.actorTemplate],
            ["Limits", sizeText(actor.size), TERM_HINT.size],
            ["Worker", <WorkerText placement={actor.placement} />],
            ["Sandbox class", sandboxClass, TERM_HINT.sandboxClass],
            ["Worker selector", workerSelectorText(actor.workerSelector), TERM_HINT.workerSelector],
            ["Can run on", <WorkerPoolLinks workerPools={usableWorkerPools} />, TERM_HINT.canRunOn],
            ["Snapshot fidelity", snapshotFidelityText(actor), TERM_HINT.snapshotFidelity],
            ["Created", formatTimestamp(actor.createdAt)],
            ["Last change", formatTimestamp(actor.updatedAt)],
          ]}
        />
      </CardContent>
    </Card>
  );
}
