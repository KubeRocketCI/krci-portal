import type { AppRouter } from "@my-project/trpc";
import type { TRPCClient } from "@trpc/client";
import type { QueryClient } from "@tanstack/react-query";
import type { NotificationEvent, NotificationListItem } from "@my-project/shared";
import { showToast } from "@/core/components/Snackbar";
import { notificationLinkToRoute, notificationsListQueryKey } from "./constants";

const RECONNECT_DELAY_MS = 5_000;

/**
 * Single ref-counted `notifications.subscribe` WebSocket shared by all
 * NotificationBell mounts (StrictMode double-mounts, future extra bells).
 * A simplified take on `core/providers/subscriptions/registry.ts` — one
 * always-on stream, no per-resource queryKey routing.
 *
 * Not auth-lifecycle-managed like its siblings: logout is a full-page
 * redirect that tears the connection down with the app. If logout ever
 * becomes an in-app transition, wire this into that lifecycle.
 */
class NotificationsSubscriptionRegistry {
  private refCount = 0;
  private subscription: ReturnType<TRPCClient<AppRouter>["notifications"]["subscribe"]["subscribe"]> | null = null;
  private trpcClient: TRPCClient<AppRouter> | null = null;
  private queryClient: QueryClient | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  configure(trpcClient: TRPCClient<AppRouter>, queryClient: QueryClient) {
    this.trpcClient = trpcClient;
    this.queryClient = queryClient;
    // A trpcClient swap invalidates any open subscription.
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.clearReconnectTimer();
  }

  subscribe(): () => void {
    this.refCount += 1;
    this.ensureSubscription();
    return () => this.unsubscribe();
  }

  private unsubscribe() {
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount === 0) {
      this.subscription?.unsubscribe();
      this.subscription = null;
      this.clearReconnectTimer();
    }
  }

  private ensureSubscription() {
    if (this.subscription || !this.trpcClient) {
      return;
    }

    this.subscription = this.trpcClient.notifications.subscribe.subscribe(undefined, {
      onData: (event) => this.handleEvent(event as NotificationEvent),
      onError: (error) => {
        console.error("[NotificationsSubscriptionRegistry] WebSocket error", error);
        this.subscription = null;
        this.scheduleReconnect();
      },
      onComplete: () => {
        this.subscription = null;
        this.scheduleReconnect();
      },
    });
  }

  /**
   * The bell lives in the always-mounted Header, so no effect ever re-runs to
   * revive a dead subscription — the registry must self-heal. wsLink already
   * replays subscriptions after transport reconnects; this covers
   * subscription-terminal errors, delayed to avoid a tight retry loop.
   */
  private scheduleReconnect() {
    if (this.refCount === 0 || this.reconnectTimer) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.refCount > 0) {
        this.ensureSubscription();
      }
    }, RECONNECT_DELAY_MS);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private handleEvent(event: NotificationEvent) {
    if (!this.queryClient) {
      return;
    }

    // A list fetch snapshotted before this event would overwrite the insert.
    void this.queryClient.cancelQueries({ queryKey: notificationsListQueryKey });

    this.queryClient.setQueryData<NotificationListItem[]>(notificationsListQueryKey, (current) => {
      const existing = current ?? [];
      // Reconnects can replay an event — the cache is idempotent on `id`,
      // matching the server-side store.
      if (existing.some((item) => item.id === event.id)) {
        return existing;
      }
      return [{ ...event, read: false }, ...existing];
    });

    showToast(event.title, event.severity, {
      description: event.body,
      route: event.link ? notificationLinkToRoute(event.link) : undefined,
    });
  }
}

export const notificationsSubscriptionRegistry = new NotificationsSubscriptionRegistry();
