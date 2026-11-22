// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  PROTOTYPE_DEFECTDOJO_QUERY_KEY_ROOT,
  PrototypeDefectDojoContext,
  type PrototypeDefectDojoApi,
} from "./context";
import { createPrototypeRequestLog } from "./requestLog";

export interface PrototypeDefectDojoProviderProps {
  /** Default: the tRPC client. */
  api?: PrototypeDefectDojoApi;
  /** Mount one provider per value (`key={cacheScope}`): the scope is read once, at mount. */
  cacheScope: string;
  children: React.ReactNode;
}

/**
 * Scope of one prototype variant. A mount starts cold: the cached reads of the scope are dropped
 * and the request log is empty, so the log shows what the variant costs on a first load.
 */
export function PrototypeDefectDojoProvider({ api, cacheScope, children }: PrototypeDefectDojoProviderProps) {
  const queryClient = useQueryClient();

  const [log] = React.useState(() => {
    // No observer of the scope exists before its children render.
    queryClient.removeQueries({ queryKey: [PROTOTYPE_DEFECTDOJO_QUERY_KEY_ROOT, cacheScope] });
    return createPrototypeRequestLog();
  });

  const value = React.useMemo(() => ({ api: api ?? null, cacheScope, log }), [api, cacheScope, log]);

  return <PrototypeDefectDojoContext.Provider value={value}>{children}</PrototypeDefectDojoContext.Provider>;
}
