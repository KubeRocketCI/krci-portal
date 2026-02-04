import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_TRIVY_EXPOSED_SECRET_DETAILS } from "./route";
import TrivyExposedSecretDetailsPage from "./page";

export default createLazyRoute(ROUTE_ID_TRIVY_EXPOSED_SECRET_DETAILS)({
  component: TrivyExposedSecretDetailsPage,
});
