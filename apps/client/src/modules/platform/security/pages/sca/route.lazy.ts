import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_SCA } from "./route";
import SCAPage from "./page";

export default createLazyRoute(ROUTE_ID_SCA)({
  component: SCAPage,
});
