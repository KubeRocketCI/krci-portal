import { useQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@/core/providers/trpc";
import { notificationsListQueryKey, NOTIFICATIONS_LIST_LIMIT } from "../constants";

export function useNotificationsQuery() {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: notificationsListQueryKey,
    queryFn: () => trpc.notifications.list.query({ limit: NOTIFICATIONS_LIST_LIMIT }),
    staleTime: 30_000,
  });
}
