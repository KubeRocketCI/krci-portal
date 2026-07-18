import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import type { AppRouter } from "@my-project/trpc";
import type { TRPCClient } from "@trpc/client";
import type { NotificationEvent, NotificationListItem } from "@my-project/shared";
import { notificationsSubscriptionRegistry } from "./notificationsSubscriptionRegistry";
import { notificationsListQueryKey } from "./constants";
import { showToast } from "@/core/components/Snackbar";

vi.mock("@/core/components/Snackbar", () => ({
  showToast: vi.fn(),
}));

interface SubscriptionHandlers {
  onData: (event: NotificationEvent) => void;
  onError: (error: unknown) => void;
  onComplete: () => void;
}

function buildEvent(id: string): NotificationEvent {
  return {
    id,
    type: "pipelinerun.failed",
    severity: "error",
    title: "Build pipeline failed",
    body: "PipelineRun failed in namespace krci",
    namespace: "krci",
    link: "/c/default/pipelineruns/xyz",
    timestamp: "2026-07-18T10:00:00Z",
  };
}

describe("notificationsSubscriptionRegistry", () => {
  let queryClient: QueryClient;
  let handlers: SubscriptionHandlers | null;
  let subscribeSpy: ReturnType<typeof vi.fn>;
  let unsubscribeSpy: ReturnType<typeof vi.fn>;
  let markReadSpy: ReturnType<typeof vi.fn>;
  let trpcClient: TRPCClient<AppRouter>;
  // The registry is a module singleton — collect cleanups so a failing test
  // can't leak an active subscription into the next one.
  let cleanups: Array<() => void>;

  beforeEach(() => {
    vi.useFakeTimers();
    queryClient = new QueryClient();
    handlers = null;
    unsubscribeSpy = vi.fn();
    subscribeSpy = vi.fn((_input: undefined, opts: SubscriptionHandlers) => {
      handlers = opts;
      return { unsubscribe: unsubscribeSpy };
    });
    markReadSpy = vi.fn().mockResolvedValue(undefined);
    trpcClient = {
      notifications: {
        subscribe: { subscribe: subscribeSpy },
        markRead: { mutate: markReadSpy },
      },
    } as unknown as TRPCClient<AppRouter>;
    cleanups = [];

    notificationsSubscriptionRegistry.configure(trpcClient, queryClient);
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) {
      cleanup();
    }
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  function join(): () => void {
    const cleanup = notificationsSubscriptionRegistry.subscribe();
    cleanups.push(cleanup);
    return cleanup;
  }

  it("shares one WS subscription across multiple subscribers (ref-counting)", () => {
    join();
    join();

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
  });

  it("closes the subscription only when the last subscriber leaves", () => {
    const first = join();
    const second = join();

    first();
    expect(unsubscribeSpy).not.toHaveBeenCalled();

    second();
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  it("prepends an incoming event to the list cache and shows a toast", () => {
    queryClient.setQueryData<NotificationListItem[]>(notificationsListQueryKey, [
      { ...buildEvent("evt-old"), read: true },
    ]);
    join();

    handlers!.onData(buildEvent("evt-new"));

    const cached = queryClient.getQueryData<NotificationListItem[]>(notificationsListQueryKey);
    expect(cached?.map((item) => item.id)).toEqual(["evt-new", "evt-old"]);
    expect(cached?.[0].read).toBe(false);
    expect(showToast).toHaveBeenCalledWith(
      "Build pipeline failed",
      "error",
      expect.objectContaining({ id: "evt-new" })
    );
  });

  it("deduplicates a re-delivered event id in the cache", () => {
    join();

    handlers!.onData(buildEvent("evt-1"));
    handlers!.onData(buildEvent("evt-1"));

    const cached = queryClient.getQueryData<NotificationListItem[]>(notificationsListQueryKey);
    expect(cached).toHaveLength(1);
  });

  it("marks the event read when the toast link is followed", async () => {
    join();

    handlers!.onData(buildEvent("evt-1"));

    const options = vi.mocked(showToast).mock.calls[0][2] as { onNavigate?: () => void };
    options.onNavigate!();
    await vi.waitFor(() => expect(markReadSpy).toHaveBeenCalledWith({ ids: ["evt-1"] }));

    await vi.waitFor(() => {
      const cached = queryClient.getQueryData<NotificationListItem[]>(notificationsListQueryKey);
      expect(cached?.[0].read).toBe(true);
    });
  });

  it("re-arms the subscription after an error while subscribers remain", () => {
    join();
    expect(subscribeSpy).toHaveBeenCalledTimes(1);

    handlers!.onError(new Error("boom"));
    expect(subscribeSpy).toHaveBeenCalledTimes(1);

    vi.runOnlyPendingTimers();
    expect(subscribeSpy).toHaveBeenCalledTimes(2);
  });

  it("does not re-arm after the last subscriber left", () => {
    const leave = join();

    handlers!.onError(new Error("boom"));
    leave();

    vi.runOnlyPendingTimers();
    expect(subscribeSpy).toHaveBeenCalledTimes(1);
  });
});
