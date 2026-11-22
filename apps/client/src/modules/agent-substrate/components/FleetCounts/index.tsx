import { actorStateGroupSchema, type FleetSummary } from "@my-project/shared";
import { ACTOR_STATE_GROUP_LABEL } from "../../constants/actorState";
import { Tile } from "../Tile";

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

export function FleetCounts({ summary }: { summary: FleetSummary }) {
  return (
    <section aria-label="Actor counts" className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Tile title="Agents" value={summary.agents} sub="Actors that serve an issue" />
        <Tile title="Actors" value={summary.actors} sub={`In ${plural(summary.atespaces, "atespace")}`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {actorStateGroupSchema.options.map((group) => (
          <Tile
            key={group}
            title={ACTOR_STATE_GROUP_LABEL[group]}
            value={summary.actorsByState[group]}
            tone={group === "crashed" && summary.actorsByState.crashed > 0 ? "bad" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
