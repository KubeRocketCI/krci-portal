import React from "react";
import { CreateDependencyTrackFormContext, type CreateDependencyTrackFormInstance } from "./context";

export const useCreateDependencyTrackForm = (): CreateDependencyTrackFormInstance => {
  const context = React.useContext(CreateDependencyTrackFormContext);
  if (!context) {
    throw new Error("useCreateDependencyTrackForm must be used within CreateDependencyTrackFormProvider");
  }
  return context;
};
