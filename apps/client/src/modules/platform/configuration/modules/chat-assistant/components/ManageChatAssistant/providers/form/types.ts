import type { ReactNode } from "react";
import { ManageChatAssistantFormValues } from "../../names";

export interface ManageChatAssistantFormProviderProps {
  children: ReactNode;
  defaultValues: Partial<ManageChatAssistantFormValues>;
  onSubmit: (values: ManageChatAssistantFormValues) => Promise<void> | void;
  onSubmitError: (error: unknown) => void;
}
