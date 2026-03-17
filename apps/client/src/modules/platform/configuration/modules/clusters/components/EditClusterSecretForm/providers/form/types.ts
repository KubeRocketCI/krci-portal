import type { ReactNode } from "react";
import type { ManageClusterSecretValues } from "../../types";

// Form provider props
export interface ClusterSecretFormProviderProps {
  defaultValues: ManageClusterSecretValues;
  onSubmit: (values: ManageClusterSecretValues) => Promise<void>;
  children: ReactNode;
}
