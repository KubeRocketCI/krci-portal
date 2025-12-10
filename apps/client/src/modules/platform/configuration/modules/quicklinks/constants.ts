import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { PageDescription } from "../../components/ConfigurationPageContent/types";
import { Settings } from "lucide-react";

export const pageDescription: PageDescription = {
  id: "quick-links",
  label: "Links",
  description: "Configure links for quick access to required tools.",
  docLink: EDP_USER_GUIDE.QUICK_LINKS.url,
  icon: Settings,
};
