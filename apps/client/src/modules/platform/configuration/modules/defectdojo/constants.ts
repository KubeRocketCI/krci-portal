import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { PageDescription } from "../../components/ConfigurationPageContent/types";
import { Settings } from "lucide-react";

export const pageDescription: PageDescription = {
  id: "defect-dojo-integration",
  label: "DefectDojo",
  description: "Manage and correlate your security findings with DefectDojo.",
  docLink: EDP_OPERATOR_GUIDE.DEFECT_DOJO.url,
  icon: Settings,
};
