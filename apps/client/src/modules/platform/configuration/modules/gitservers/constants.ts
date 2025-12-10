import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { PageDescription } from "../../components/ConfigurationPageContent/types";
import { Settings } from "lucide-react";

export const pageDescription: PageDescription = {
  id: "git-server-list",
  label: "Git Servers",
  description: "Integrate platform with Version Control Systems.",
  docLink: EDP_USER_GUIDE.GIT_SERVER_CREATE.url,
  icon: Settings,
};
