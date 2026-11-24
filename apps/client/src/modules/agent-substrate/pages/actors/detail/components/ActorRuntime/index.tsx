import type { ActorRow } from "@my-project/shared";
import { Card, CardContent } from "@/core/components/ui/card";
import { KV } from "../../../../../components/KV";
import { TERM_HINT } from "../../../../../constants/hints";
import { placementWorkerPool } from "../../../../../utils/roomLabel";

/** `placement` is null while the actor is suspended or crashed. */
export function ActorRuntime({ actor }: { actor: ActorRow }) {
  const { placement } = actor;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        {!placement && (
          <p className="text-muted-foreground text-sm">The actor runs on no worker while it is {actor.state}.</p>
        )}
        <KV
          rows={[
            ["Worker", placement?.worker],
            ["Worker pool", placementWorkerPool(placement), TERM_HINT.workerPool],
            ["Worker pod", placement?.workerPod],
            ["Node", placement?.node],
            ["Sandbox runtime", placement?.sandboxRuntime, TERM_HINT.sandboxRuntime],
          ]}
        />
      </CardContent>
    </Card>
  );
}
