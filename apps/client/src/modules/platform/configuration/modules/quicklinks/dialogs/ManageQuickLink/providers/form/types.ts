import type { ReactNode } from "react";
import type { ManageQuickLinkFormValues } from "../../types";

// Form provider props
export interface QuickLinkFormProviderProps {
  defaultValues: ManageQuickLinkFormValues;
  onSubmit: (values: ManageQuickLinkFormValues) => Promise<void>;
  children: ReactNode;
}
