// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import { Button } from "@/core/components/ui/button";
import { PrototypeDefectDojoContext } from "../api/context";
import { usePrototypeDefectDojoReset } from "../api/hooks";
import { usePrototypeRequestLogEntries } from "../api/requestLog";

export interface PrototypeStatePanelProps {
  /** Joined values and selections of the prototype, printed as JSON. */
  state: unknown;
}

/** Collapsed debug block: the prototype state and every DefectDojo request of the mounted variant. */
export function PrototypeStatePanel({ state }: PrototypeStatePanelProps) {
  const { cacheScope, log } = React.useContext(PrototypeDefectDojoContext);
  const entries = usePrototypeRequestLogEntries(log);
  const reset = usePrototypeDefectDojoReset();

  const requestCount = entries.reduce((total, entry) => total + entry.requests.length, 0);

  return (
    <details
      data-testid="prototype-state-panel"
      className="rounded border border-dashed border-fuchsia-500 p-2 font-mono text-xs"
    >
      <summary className="cursor-pointer">
        PROTOTYPE state: variant {cacheScope}, {entries.length} tRPC calls, {requestCount} DefectDojo requests
      </summary>
      <div className="mt-2 space-y-2">
        <Button variant="outline" size="xs" onClick={() => void reset()}>
          Reset cache and log
        </Button>
        <pre className="bg-muted max-h-64 overflow-auto rounded p-2">{JSON.stringify(state, null, 2)}</pre>
        <ol className="bg-muted max-h-64 list-decimal overflow-auto rounded p-2 pl-8">
          {entries.map((entry, index) => (
            <li key={index}>
              {entry.procedure} [{entry.state}]
              <ul>
                {entry.requests.map((request, requestIndex) => (
                  <li key={requestIndex} className="break-all">
                    GET {request}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
