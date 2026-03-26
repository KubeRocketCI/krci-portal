import React from "react";
import type { RequestError } from "@/core/types/global";

// Context to share error state between provider and form
export const CreateRegistryFormErrorContext = React.createContext<{
  error: RequestError | null;
  setError: (error: RequestError | null) => void;
} | null>(null);

export const useCreateRegistryFormError = () => {
  const context = React.useContext(CreateRegistryFormErrorContext);
  if (!context) {
    throw new Error("useCreateRegistryFormError must be used within CreateRegistryFormProviderWrapper");
  }
  return context;
};
