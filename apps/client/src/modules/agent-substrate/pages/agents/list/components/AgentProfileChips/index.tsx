import React from "react";
import { useStore } from "@tanstack/react-form";
import type { ActorRow } from "@my-project/shared";
import { ToggleButton, ToggleButtonGroup } from "@/core/components/ui/toggle-button-group";
import { useFilterContext } from "@/core/providers/Filter";
import { AGENT_FILTER_NAMES } from "../../../../../constants/agentFilter";
import { ALL_FILTER_VALUE } from "../../../../../utils/fleetFilter";
import { agentProfileChips } from "../../utils/agentProfileChips";
import type { AgentFilterValues } from "../AgentFilter/types";

/** Sets the agent profile filter, the one the Table view's select sets. */
export function AgentProfileChips({ agents }: { agents: ActorRow[] }) {
  const { form } = useFilterContext<ActorRow, AgentFilterValues>();
  const values = useStore(form.store, (state) => state.values);
  const chips = React.useMemo(() => agentProfileChips(agents, values), [agents, values]);

  return (
    <div className="overflow-x-auto">
      <form.AppField name={AGENT_FILTER_NAMES.AGENT_PROFILE}>
        {(field) => (
          <ToggleButtonGroup<string>
            value={field.state.value}
            onChange={(_event, next) => field.handleChange(next ?? ALL_FILTER_VALUE)}
            aria-label="Agent profile"
          >
            {chips.map(({ value, label, count }) => (
              <ToggleButton key={value} value={value}>
                {label} · {count}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      </form.AppField>
    </div>
  );
}
