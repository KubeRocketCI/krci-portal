import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { PageDescription } from "../../components/ConfigurationPageContent/types";
import { Settings } from "lucide-react";

export const pageDescription: PageDescription = {
  id: "codemie-integration",
  label: "CodeMie",
  description: "Configure CodeMie integration.",
  docLink: EDP_USER_GUIDE.ADD_AI_ASSISTANT.url,
  icon: Settings,
};
