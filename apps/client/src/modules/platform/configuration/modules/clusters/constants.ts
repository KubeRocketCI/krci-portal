import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { PageDescription } from "../../components/ConfigurationPageContent/types";
import { Settings } from "lucide-react";

export const pageDescription: PageDescription = {
  id: "cluster-list",
  label: "Clusters",
  description: "Scale workloads across multiple Kubernetes clusters.",
  docLink: EDP_USER_GUIDE.CLUSTER_CREATE.url,
  icon: Settings,
};
