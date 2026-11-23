import React from "react";
import { X } from "lucide-react";
import { actorStateGroupSchema, type ActorRow, type Atespace } from "@my-project/shared";
import type { SelectOption } from "@/core/components/form";
import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import { useFilterContext } from "@/core/providers/Filter";
import { ACTOR_STATE_GROUP_LABEL } from "../../../../../constants/actorState";
import { ACTOR_FILTER_NAMES, ALL_FILTER_VALUE } from "./constants";
import type { ActorFilterValues } from "./types";

const ALL_OPTION: SelectOption = { label: "All", value: ALL_FILTER_VALUE };

const actorStateOptions: SelectOption[] = [
  ALL_OPTION,
  ...actorStateGroupSchema.options.map((group) => ({ label: ACTOR_STATE_GROUP_LABEL[group], value: group })),
];

interface ActorFilterProps {
  atespaces: Atespace[];
  actors: ActorRow[];
}

export function ActorFilter({ atespaces, actors }: ActorFilterProps) {
  const { form, reset, isDefaultValue } = useFilterContext<ActorRow, ActorFilterValues>();

  const atespaceOptions = React.useMemo<SelectOption[]>(
    () => [ALL_OPTION, ...atespaces.map(({ name }) => ({ label: name, value: name }))],
    [atespaces]
  );

  const codebaseOptions = React.useMemo<SelectOption[]>(() => {
    const names = new Set(actors.flatMap(({ agent }) => (agent?.codebase ? [agent.codebase.name] : [])));
    return [ALL_OPTION, ...[...names].sort().map((name) => ({ label: name, value: name }))];
  }, [actors]);

  return (
    <>
      <div className="col-span-3">
        <form.AppField name={ACTOR_FILTER_NAMES.ATESPACE}>
          {(field) => <field.FormSelect label="Atespace" options={atespaceOptions} placeholder="Select atespace" />}
        </form.AppField>
      </div>

      <div className="col-span-3">
        <form.AppField name={ACTOR_FILTER_NAMES.ACTOR_STATE}>
          {(field) => (
            <field.FormSelect label="Actor state" options={actorStateOptions} placeholder="Select actor state" />
          )}
        </form.AppField>
      </div>

      <div className="col-span-3">
        <form.AppField name={ACTOR_FILTER_NAMES.CODEBASE}>
          {(field) => <field.FormSelect label="Codebase" options={codebaseOptions} placeholder="Select Codebase" />}
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
