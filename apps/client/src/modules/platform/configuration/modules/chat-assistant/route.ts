import { routeCluster } from "@/core/router";
import { createRoute } from "@tanstack/react-router";

export const routeChatAssistantConfiguration = createRoute({
  getParentRoute: () => routeCluster,
  path: "/configuration/chat-assistant",
}).lazy(() => import("./route.lazy").then((res) => res.default));
