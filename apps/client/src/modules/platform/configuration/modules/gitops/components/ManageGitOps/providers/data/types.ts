import type { ReactNode } from "react";
import type { ManageGitOpsDataContext } from "../../types";

// Data provider props
export interface GitOpsDataProviderProps {
  formData: ManageGitOpsDataContext;
  children: ReactNode;
}
