import { createLazyRoute } from "@tanstack/react-router";
import { PATH_SCA_FULL } from "./route";
import SCAPage from "./page";

export default createLazyRoute(PATH_SCA_FULL)({
  component: SCAPage,
});
