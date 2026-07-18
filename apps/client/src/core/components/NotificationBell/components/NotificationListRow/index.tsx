import type { NotificationListItem } from "@my-project/shared";
import { cn } from "@/core/utils/classname";
import { formatRelativeTime } from "@/core/utils/date-humanize/utils";
import { NotificationSeverityIcon } from "../NotificationSeverityIcon";

interface NotificationListRowProps {
  notification: NotificationListItem;
  onOpen: (notification: NotificationListItem) => void;
}

export function NotificationListRow({ notification, onOpen }: NotificationListRowProps) {
  const { severity, title, body, timestamp, read, link } = notification;

  const content = (
    <div className="flex items-start gap-2 py-2">
      <NotificationSeverityIcon severity={severity} />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", read ? "text-muted-foreground font-normal" : "font-medium")}>{title}</p>
        <p className="text-muted-foreground line-clamp-2 text-xs">{body}</p>
        <p className="text-muted-foreground mt-1 text-[11px]">{formatRelativeTime(timestamp)}</p>
      </div>
      {!read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-(--primary)" aria-label="Unread" />}
    </div>
  );

  if (!link) {
    return <div className="px-2">{content}</div>;
  }

  return (
    <button
      type="button"
      className="hover:bg-accent w-full rounded-md px-2 text-left transition-colors"
      onClick={() => onOpen(notification)}
    >
      {content}
    </button>
  );
}
