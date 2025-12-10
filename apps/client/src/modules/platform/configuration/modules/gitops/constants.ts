import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { PageDescription } from "../../components/ConfigurationPageContent/types";
import { Settings } from "lucide-react";

export const pageDescription: PageDescription = {
  id: "gitops",
  label: "GitOps",
  description: "Set up the required environment state using the GitOps approach.",
  docLink: EDP_USER_GUIDE.GIT_OPS.url,
  icon: Settings,
};
