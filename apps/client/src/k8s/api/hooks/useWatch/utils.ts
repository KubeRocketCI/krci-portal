/**
 * Threshold-based refetchOnWindowFocus for K8s watch queries.
 * Refetches when the window regains focus if data is older than 30 seconds.
 * This handles browser sleep/tab throttling where WebSocket events may be missed,
 * and serves as a safety net when the K8s watch subscription silently ends.
 * During normal operation, WebSocket updates keep data fresh without refetching.
 */
const WATCH_STALE_THRESHOLD_MS = 30 * 1000;

export const refetchOnWindowFocusIfStale = (query: { state: { dataUpdatedAt: number } }) =>
  query.state.dataUpdatedAt < Date.now() - WATCH_STALE_THRESHOLD_MS;
