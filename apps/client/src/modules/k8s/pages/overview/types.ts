import type { Event as K8sEvent } from "@my-project/shared";

/** Cluster-overview "Recent events" item — the shared core/v1 `Event` type. */
export type OverviewEvent = K8sEvent;
