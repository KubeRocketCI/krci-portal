import type { ReactNode } from "react";
import type { ZodSchema } from "zod";

// Form provider props - generic over the form values type T.
// formSchema uses unparameterized ZodSchema because Zod schemas with .default()
// have different input/output types that don't satisfy ZodSchema<T> directly.
export interface CodebaseBranchFormProviderProps<T extends Record<string, unknown> = Record<string, unknown>> {
  defaultValues: Partial<T>;
  formSchema: ZodSchema;
  onSubmit: (values: T) => Promise<void>;
  onSubmitError: (error: unknown) => void;
  children: ReactNode;
}
