import React from "react";
import { X } from "lucide-react";
import type { ActorRow } from "@my-project/shared";
import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import { useFilterContext } from "@/core/providers/Filter";
import { AGENT_FILTER_NAMES } from "../../../../../constants/agentFilter";
import { actorStateOptions, agentProfileOptions, codebaseOptions } from "../../../../../utils/fleetFilter";
import type { AgentFilterValues } from "./types";

interface AgentFilterProps {
  agents: ActorRow[];
  /** The view By codebase: no agent profile select; the agent profile chips replace it. */
  byCodebase?: boolean;
}

/** Renders into a `grid-cols-12` parent. */
export function AgentFilter({ agents, byCodebase = false }: AgentFilterProps) {
  const { form, reset, isDefaultValue } = useFilterContext<ActorRow, AgentFilterValues>();

  const codebaseSelectOptions = React.useMemo(() => codebaseOptions(agents), [agents]);

  const agentProfileSelectOptions = React.useMemo(() => agentProfileOptions(agents), [agents]);

  return (
    <>
      <div className="col-span-2">
        <form.AppField name={AGENT_FILTER_NAMES.CODEBASE}>
          {(field) => (
            <field.FormSelect label="Codebase" options={codebaseSelectOptions} placeholder="Select Codebase" />
          )}
        </form.AppField>
      </div>

      {!byCodebase && (
        <div className="col-span-2">
          <form.AppField name={AGENT_FILTER_NAMES.AGENT_PROFILE}>
            {(field) => (
              <field.FormSelect
                label="Agent profile"
                options={agentProfileSelectOptions}
                placeholder="Select agent profile"
              />
            )}
          </form.AppField>
        </div>
      )}

      <div className="col-span-2">
        <form.AppField name={AGENT_FILTER_NAMES.ACTOR_STATE}>
          {(field) => (
            <field.FormSelect label="Actor state" options={actorStateOptions} placeholder="Select actor state" />
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
