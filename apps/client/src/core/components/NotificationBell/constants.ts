import type { RouteParams } from "@/core/router/types";
import type { QueryKey } from "@tanstack/react-query";

/** Written directly by the subscription registry (setQueryData), read by the list query. */
export const notificationsListQueryKey: QueryKey = ["notifications", "list"];

export const NOTIFICATIONS_LIST_LIMIT = 20;

/**
 * Notification links are server-provided paths, not build-time routes, so the
 * router's literal `to` union is widened here — the one sanctioned cast. The
 * schema guarantees an app-relative path, so this cannot navigate off-app.
 */
export function notificationLinkToRoute(link: string): RouteParams {
  return { to: link } as RouteParams;
}
