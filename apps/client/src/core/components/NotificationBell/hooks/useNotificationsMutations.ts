import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotificationListItem } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { notificationsListQueryKey } from "../constants";

// onMutate cancels in-flight list fetches: a pre-mutation refetch resolving
// late would overwrite the read-flip with its stale (unread) snapshot.

export function useMarkNotificationsRead() {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => trpc.notifications.markRead.mutate({ ids }),
    onMutate: () => queryClient.cancelQueries({ queryKey: notificationsListQueryKey }),
    onSuccess: (_result, ids) => {
      queryClient.setQueryData<NotificationListItem[]>(notificationsListQueryKey, (current) =>
        current?.map((item) => (ids.includes(item.id) ? { ...item, read: true } : item))
      );
    },
  });
}

export function useMarkAllNotificationsRead() {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => trpc.notifications.markAllRead.mutate(),
    onMutate: () => queryClient.cancelQueries({ queryKey: notificationsListQueryKey }),
    onSuccess: () => {
      queryClient.setQueryData<NotificationListItem[]>(notificationsListQueryKey, (current) =>
        current?.map((item) => ({ ...item, read: true }))
      );
    },
  });
}
