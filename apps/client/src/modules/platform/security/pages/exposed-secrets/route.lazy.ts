import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_EXPOSED_SECRETS } from "./route";
import ExposedSecretsPage from "./page";

export default createLazyRoute(ROUTE_ID_EXPOSED_SECRETS)({
  component: ExposedSecretsPage,
});
