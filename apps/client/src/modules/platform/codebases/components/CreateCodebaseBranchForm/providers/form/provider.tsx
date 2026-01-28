import React from "react";
import { useAppForm } from "@/core/form-temp";
import type { FormValidateOrFn } from "@tanstack/react-form";
import { CreateCodebaseBranchFormContext, CreateValidationContext, CreateCodebaseBranchFormInstance } from "./context";
import type { CreateCodebaseBranchFormProviderProps } from "./types";
import type { CreateCodebaseBranchFormValues } from "../../types";
import { createCodebaseBranchSchema } from "../../schema";

export const CreateCodebaseBranchFormProvider: React.FC<CreateCodebaseBranchFormProviderProps> = ({
  defaultValues,
  validationContext,
  onSubmit,
  onSubmitError,
  children,
}) => {
  const formSchema = React.useMemo(() => createCodebaseBranchSchema(validationContext), [validationContext]);

  const form = useAppForm({
    defaultValues: defaultValues as CreateCodebaseBranchFormValues,
    validators: {
      onChange: formSchema as unknown as FormValidateOrFn<CreateCodebaseBranchFormValues>,
    },
    onSubmit: async ({ value, formApi }) => {
      const validationResult = formSchema.safeParse(value);

      if (!validationResult.success) {
        validationResult.error.errors.forEach((error) => {
          const fieldPath = error.path.join(".");
          formApi.setFieldMeta(fieldPath as never, (prev) => ({ ...prev, isTouched: true }));
        });
        return;
      }

      try {
        await onSubmit(value);
      } catch (error) {
        onSubmitError(error);
      }
    },
  });

  return (
    <CreateValidationContext.Provider value={{ formSchema }}>
      <CreateCodebaseBranchFormContext.Provider value={form as CreateCodebaseBranchFormInstance}>
        {children}
      </CreateCodebaseBranchFormContext.Provider>
    </CreateValidationContext.Provider>
  );
};
