import * as React from "react";
import { CursorStore, CursorStoreContext } from "./useMetricsCursor";

export function MetricsCursorProvider({ children }: { children: React.ReactNode }) {
  const [store] = React.useState(() => new CursorStore());
  return <CursorStoreContext.Provider value={store}>{children}</CursorStoreContext.Provider>;
}
