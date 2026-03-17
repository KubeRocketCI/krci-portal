import type { CreateJiraFormValues } from "../../schema";

export interface CreateJiraFormProviderProps {
  children: React.ReactNode;
  defaultValues: Partial<CreateJiraFormValues>;
  onSubmit: (values: CreateJiraFormValues) => Promise<void>;
  onSubmitError?: (error: unknown) => void;
}
