import { useContext } from "react";
import { ManageDependencyTrackFormContext } from "./context";

export const useManageDependencyTrackForm = () => {
  const context = useContext(ManageDependencyTrackFormContext);
  if (!context) {
    throw new Error("useManageDependencyTrackForm must be used within ManageDependencyTrackFormProvider");
  }
  return context;
};
