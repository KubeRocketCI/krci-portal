import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CONFIG_QUICKLINKS } from "./route";
import Page from "./page";

const QuicklinksConfigurationRoute = createLazyRoute(ROUTE_ID_CONFIG_QUICKLINKS)({
  component: Page,
});

export default QuicklinksConfigurationRoute;
