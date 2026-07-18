import { t } from "../../trpc.js";
import { list, markRead, markAllRead, subscribe } from "./procedures/index.js";

export const notificationsRouter = t.router({
  list,
  markRead,
  markAllRead,
  subscribe,
});
