import { createLazyRoute } from "@tanstack/react-router";
import DefectdojoConfigurationPage from "./view";

const DefectdojoConfigurationRoute = createLazyRoute("/c/$clusterName/configuration/defectdojo")({
  component: DefectdojoConfigurationPage,
});

export default DefectdojoConfigurationRoute;
