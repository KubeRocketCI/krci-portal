import { Bell } from "lucide-react";
import type { NotificationListItem } from "@my-project/shared";
import { Button } from "@/core/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/components/ui/popover";
import { Badge } from "@/core/components/ui/badge";
import { Separator } from "@/core/components/ui/separator";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { router } from "@/core/router";
import { notificationLinkToRoute } from "./constants";
import { useNotificationsQuery } from "./hooks/useNotificationsQuery";
import { useMarkNotificationsRead, useMarkAllNotificationsRead } from "./hooks/useNotificationsMutations";
import { useNotificationsSubscription } from "./hooks/useNotificationsSubscription";
import { NotificationListRow } from "./components/NotificationListRow";

export function NotificationBell() {
  useNotificationsSubscription();

  const { data, isLoading } = useNotificationsQuery();
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data ?? [];
  const unreadCount = notifications.filter((item) => !item.read).length;

  function handleOpen(notification: NotificationListItem) {
    if (!notification.read) {
      markRead.mutate([notification.id]);
    }
    if (notification.link) {
      router.navigate(notificationLinkToRoute(notification.link));
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full text-white hover:bg-white/10"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] max-w-[90vw] p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs"
            disabled={unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            Mark all read
          </Button>
        </div>
        <Separator />
        <div className="max-h-[400px] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size={24} />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-muted-foreground px-2 py-8 text-center text-sm">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <NotificationListRow key={notification.id} notification={notification} onOpen={handleOpen} />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
