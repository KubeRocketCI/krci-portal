import type { KubeObjectBase } from "@my-project/shared";

/** The shared `Event` schema is `.passthrough()`, so we type only the fields the overview renders. */
export interface OverviewEvent extends KubeObjectBase {
  type?: string;
  reason?: string;
  message?: string;
  lastTimestamp?: string;
  eventTime?: string;
  involvedObject?: {
    kind?: string;
    namespace?: string;
    name?: string;
    uid?: string;
  };
}
