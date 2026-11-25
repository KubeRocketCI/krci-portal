import React from "react";
import { X } from "lucide-react";
import type { ActorRow, Atespace, WorkerPoolRow } from "@my-project/shared";
import type { SelectOption } from "@/core/components/form";
import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import { useFilterContext } from "@/core/providers/Filter";
import { ACTOR_FILTER_NAMES } from "../../../../../constants/actorFilter";
import { ALL_OPTION, actorStateOptions, agentProfileOptions, codebaseOptions } from "../../../../../utils/fleetFilter";
import { workerPoolText } from "../../../../../utils/roomLabel";
import type { ActorFilterValues } from "./types";

interface ActorFilterProps {
  atespaces: Atespace[];
  actors: ActorRow[];
  workerPools: WorkerPoolRow[];
}

export function ActorFilter({ atespaces, actors, workerPools }: ActorFilterProps) {
  const { form, reset, isDefaultValue } = useFilterContext<ActorRow, ActorFilterValues>();

  const workerPoolOptions = React.useMemo<SelectOption[]>(
    () => [
      ALL_OPTION,
      ...workerPools.map((workerPool) => ({
        label: workerPoolText(workerPool),
        value: workerPoolText(workerPool),
      })),
    ],
    [workerPools]
  );

  const atespaceOptions = React.useMemo<SelectOption[]>(
    () => [ALL_OPTION, ...atespaces.map(({ name }) => ({ label: name, value: name }))],
    [atespaces]
  );

  const codebaseSelectOptions = React.useMemo(() => codebaseOptions(actors), [actors]);

  const agentProfileSelectOptions = React.useMemo(() => agentProfileOptions(actors), [actors]);

  return (
    <>
      <div className="col-span-2">
        <form.AppField name={ACTOR_FILTER_NAMES.ATESPACE}>
          {(field) => <field.FormSelect label="Atespace" options={atespaceOptions} placeholder="Select atespace" />}
        </form.AppField>
      </div>

      <div className="col-span-2">
        <form.AppField name={ACTOR_FILTER_NAMES.ACTOR_STATE}>
          {(field) => (
            <field.FormSelect label="Actor state" options={actorStateOptions} placeholder="Select actor state" />
          )}
        </form.AppField>
      </div>

      <div className="col-span-2">
        <form.AppField name={ACTOR_FILTER_NAMES.CODEBASE}>
          {(field) => (
            <field.FormSelect label="Codebase" options={codebaseSelectOptions} placeholder="Select Codebase" />
          )}
        </form.AppField>
      </div>

      <div className="col-span-2">
        <form.AppField name={ACTOR_FILTER_NAMES.AGENT_PROFILE}>
          {(field) => (
            <field.FormSelect
              label="Agent profile"
              options={agentProfileSelectOptions}
              placeholder="Select agent profile"
            />
          )}
        </form.AppField>
      </div>

      <div className="col-span-2">
        <form.AppField name={ACTOR_FILTER_NAMES.WORKER_POOL}>
          {(field) => (
            <field.FormSelect label="Worker pool" options={workerPoolOptions} placeholder="Select worker pool" />
          )}
        </form.AppField>
      </div>

      {!isDefaultValue && (
        <div className="col-span-1 flex flex-col gap-2">
          <Label> </Label>
          <Button variant="secondary" onClick={reset} size="sm" className="mt-0.5">
            <X size={16} />
            Clear
          </Button>
        </div>
      )}
    </>
  );
}
