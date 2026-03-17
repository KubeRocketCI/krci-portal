import React from "react";
import { EditDependencyTrackFormContext, type EditDependencyTrackFormInstance } from "./context";

export const useEditDependencyTrackForm = (): EditDependencyTrackFormInstance => {
  const context = React.useContext(EditDependencyTrackFormContext);
  if (!context) {
    throw new Error("useEditDependencyTrackForm must be used within EditDependencyTrackFormProvider");
  }
  return context;
};
