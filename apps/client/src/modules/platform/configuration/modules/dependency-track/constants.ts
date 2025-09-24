import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { PageDescription } from "../../components/ConfigurationPageContent/types";

export const pageDescription: PageDescription = {
  id: "dependency-track-integration",
  label: "DependencyTrack",
  description: "Monitor and manage vulnerabilities within third-party components.",
  docLink: EDP_OPERATOR_GUIDE.DEPENDENCY_TRACK.url,
};
