// Form context setup - separate file to avoid circular dependencies
// Components import from this file, main index.ts re-exports

import { createFormHookContexts } from "@tanstack/react-form";

// Create contexts for form and field
// These are used by components to access field/form state via useFieldContext/useFormContext
export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();
