import { useContext } from "react";
import { CreateSonarFormContext } from "./context";

export const useCreateSonarForm = () => {
  const context = useContext(CreateSonarFormContext);
  if (!context) {
    throw new Error("useCreateSonarForm must be used within CreateSonarFormProvider");
  }
  return context;
};
