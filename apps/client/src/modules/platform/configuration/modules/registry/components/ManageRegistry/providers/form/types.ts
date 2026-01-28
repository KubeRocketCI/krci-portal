import type { ManageRegistryFormValues } from "../../schema";

export interface ManageRegistryFormProviderProps {
  children: React.ReactNode;
  defaultValues: Partial<ManageRegistryFormValues>;
  onSubmit: (values: ManageRegistryFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
}
