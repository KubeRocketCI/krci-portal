import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_EXPOSED_SECRETS } from "./route";
import TrivyExposedSecretsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_EXPOSED_SECRETS)({
  component: TrivyExposedSecretsPage,
});
