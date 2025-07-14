import { createLazyRoute } from "@tanstack/react-router";
import ChatAssistantConfigurationPage from "./view";

const ChatAssistantConfigurationRoute = createLazyRoute("/c/$clusterName/configuration/chat-assistant")({
  component: ChatAssistantConfigurationPage,
});

export default ChatAssistantConfigurationRoute;
