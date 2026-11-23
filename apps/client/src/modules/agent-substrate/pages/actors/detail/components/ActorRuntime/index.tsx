import type { ActorRow } from "@my-project/shared";
import { Card, CardContent } from "@/core/components/ui/card";
import { KV } from "../../../../../components/KV";

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
            ["Worker pool", placement && `${placement.workerNamespace}/${placement.workerPool}`],
            ["Pod", placement?.pod],
            ["Node", placement?.node],
            ["Sandbox runtime", placement?.sandboxRuntime],
          ]}
        />
      </CardContent>
    </Card>
  );
}
