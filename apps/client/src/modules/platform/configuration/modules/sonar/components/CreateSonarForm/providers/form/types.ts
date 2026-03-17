import type { CreateSonarFormValues } from "../../schema";

export interface CreateSonarFormProviderProps {
  children: React.ReactNode;
  defaultValues: Partial<CreateSonarFormValues>;
  onSubmit: (values: CreateSonarFormValues) => Promise<void>;
  onSubmitError?: (error: unknown) => void;
}
