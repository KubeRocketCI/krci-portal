import { createLazyRoute } from "@tanstack/react-router";
import Page from "./page";

const QuicklinksConfigurationRoute = createLazyRoute("/c/$clusterName/configuration/quicklinks")({
  component: Page,
});

export default QuicklinksConfigurationRoute;
