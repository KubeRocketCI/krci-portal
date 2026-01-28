import { useContext } from "react";
import { ManageSonarFormContext } from "./context";

export const useManageSonarForm = () => {
  const context = useContext(ManageSonarFormContext);
  if (!context) {
    throw new Error("useManageSonarForm must be used within ManageSonarFormProvider");
  }
  return context;
};
