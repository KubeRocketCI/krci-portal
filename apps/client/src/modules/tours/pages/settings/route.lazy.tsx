import { createLazyRoute } from "@tanstack/react-router";
import ToursSettingsPageContent from "./view";

const Route = createLazyRoute("/_layout/settings/tours")({
  component: ToursSettingsPageContent,
});

export default Route;
