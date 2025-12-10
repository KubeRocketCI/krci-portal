import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { PageDescription } from "../../components/ConfigurationPageContent/types";
import { Settings } from "lucide-react";

export const pageDescription: PageDescription = {
  id: "jira-integration",
  label: "Jira",
  description: "Track and deliver your projects with Jira.",
  docLink: EDP_OPERATOR_GUIDE.JIRA.url,
  icon: Settings,
};
