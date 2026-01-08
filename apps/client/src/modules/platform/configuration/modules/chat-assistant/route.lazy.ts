import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CONFIG_CHAT_ASSISTANT } from "./route";
import ChatAssistantConfigurationPage from "./view";

const ChatAssistantConfigurationRoute = createLazyRoute(ROUTE_ID_CONFIG_CHAT_ASSISTANT)({
  component: ChatAssistantConfigurationPage,
});

export default ChatAssistantConfigurationRoute;
