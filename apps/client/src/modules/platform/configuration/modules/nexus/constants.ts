import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { PageDescription } from "../../components/ConfigurationPageContent/types";
import { Settings } from "lucide-react";

export const pageDescription: PageDescription = {
  id: "nexus-integration",
  label: "Nexus",
  description: "Store and manage your application artifacts in Nexus.",
  docLink: EDP_OPERATOR_GUIDE.NEXUS.url,
  icon: Settings,
};
