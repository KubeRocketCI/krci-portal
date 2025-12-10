import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { PageDescription } from "../../components/ConfigurationPageContent/types";
import { Settings } from "lucide-react";

export const pageDescription: PageDescription = {
  id: "sonar-integration",
  label: "SonarQube",
  description: "Enable automated code review mechanisms powered by SonarQube.",
  docLink: EDP_OPERATOR_GUIDE.SONAR.url,
  icon: Settings,
};
