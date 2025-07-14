import { createLazyRoute } from "@tanstack/react-router";
import JiraConfigurationPage from "./view";

const JiraConfigurationRoute = createLazyRoute("/c/$clusterName/configuration/jira")({
  component: JiraConfigurationPage,
});

export default JiraConfigurationRoute;
