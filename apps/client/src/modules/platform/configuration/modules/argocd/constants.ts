import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { PageDescription } from "../../components/ConfigurationPageContent/types";

export const pageDescription: PageDescription = {
  id: "argocd-integration",
  label: "Argo CD",
  description: "Configure Argo CD integration.",
  docLink: EDP_OPERATOR_GUIDE.ARGO_CD.url,
};
