import { routeConfiguration } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";

export const PATH_CONFIG_CHAT_ASSISTANT = "chat-assistant" as const;
export const PATH_CONFIG_CHAT_ASSISTANT_FULL = "/c/$clusterName/configuration/chat-assistant" as const;
export const ROUTE_ID_CONFIG_CHAT_ASSISTANT = "/_layout/c/$clusterName/configuration/chat-assistant" as const;

export const routeChatAssistantConfiguration = createRoute({
  getParentRoute: () => routeConfiguration,
  path: PATH_CONFIG_CHAT_ASSISTANT,
  head: () => ({
    meta: [{ title: "Chat Assistant Configuration | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
