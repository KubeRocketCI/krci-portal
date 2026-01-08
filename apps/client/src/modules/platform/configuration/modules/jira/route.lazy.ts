import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CONFIG_JIRA } from "./route";
import JiraConfigurationPage from "./view";

const JiraConfigurationRoute = createLazyRoute(ROUTE_ID_CONFIG_JIRA)({
  component: JiraConfigurationPage,
});

export default JiraConfigurationRoute;
