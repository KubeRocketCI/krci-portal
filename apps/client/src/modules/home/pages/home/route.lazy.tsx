import { createLazyRoute } from "@tanstack/react-router";
import HomePage from "./view";

const HomeRoute = createLazyRoute("/")({
  component: HomePage,
});

export default HomeRoute;
