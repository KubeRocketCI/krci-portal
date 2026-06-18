import { useMemo } from "react";
import type { RequestError } from "@/core/types/global";
import { formatK8sErrors } from "../utils/formatK8sErrors";
import type { WatchStatus } from "../components/WatchConnectionIndicator";

/** Derives the non-blocking error banner and connection status from a multi-namespace watch's raw errors. */
export function useK8sWatchStatus(rawErrors: RequestError[] | null | undefined): {
  errors: Error[];
  watchStatus: WatchStatus;
} {
  const errors = useMemo(() => formatK8sErrors(rawErrors), [rawErrors]);
  const watchStatus: WatchStatus = errors.length > 0 ? "error" : "connected";
  return { errors, watchStatus };
}
