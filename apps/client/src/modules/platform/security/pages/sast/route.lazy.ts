import { createLazyRoute } from "@tanstack/react-router";
import { PATH_SAST_FULL } from "./route";
import SASTPage from "./page";

export default createLazyRoute(PATH_SAST_FULL)({
  component: SASTPage,
});
