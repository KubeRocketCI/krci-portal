import type { EditSonarFormValues } from "../../schema";

export interface EditSonarFormProviderProps {
  defaultValues: Partial<EditSonarFormValues>;
  onSubmit: (values: EditSonarFormValues) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: React.ReactNode;
}
