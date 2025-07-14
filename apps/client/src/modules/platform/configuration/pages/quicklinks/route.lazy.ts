import { createLazyRoute } from "@tanstack/react-router";
import QuicklinksConfigurationPage from "./view";

const QuicklinksConfigurationRoute = createLazyRoute("/c/$clusterName/configuration/quicklinks")({
  component: QuicklinksConfigurationPage,
});

export default QuicklinksConfigurationRoute;
