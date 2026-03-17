import type { ReactNode } from "react";
import type { ManageClusterSecretDataContext } from "../../types";

// Data provider props
export interface ClusterSecretDataProviderProps {
  formData: ManageClusterSecretDataContext;
  children: ReactNode;
}
