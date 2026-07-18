import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPCClient } from "@/core/providers/trpc";
import { notificationsSubscriptionRegistry } from "../notificationsSubscriptionRegistry";

export function useNotificationsSubscription() {
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    notificationsSubscriptionRegistry.configure(trpcClient, queryClient);
    return notificationsSubscriptionRegistry.subscribe();
  }, [trpcClient, queryClient]);
}
