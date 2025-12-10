import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { PageDescription } from "../../components/ConfigurationPageContent/types";
import { Settings } from "lucide-react";

export const pageDescription: PageDescription = {
  id: "registry-integration",
  label: "Registry",
  description: "Configure your container registry integration.",
  docLink: EDP_OPERATOR_GUIDE.CONTAINER_REGISTRY_HARBOR?.url,
  icon: Settings,
};
