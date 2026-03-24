import type { ReactNode } from "react";
import type { AnyFormApi } from "@tanstack/react-form";
import type { EditGitServerFormValues } from "../../names";

export interface EditGitServerFormProviderProps {
  children: ReactNode;
  defaultValues: Partial<EditGitServerFormValues>;
  onSubmit: (values: EditGitServerFormValues, formApi: AnyFormApi) => Promise<void>;
  onSubmitError: (error: unknown) => void;
}
