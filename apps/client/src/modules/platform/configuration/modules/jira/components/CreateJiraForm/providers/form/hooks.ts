import { useContext } from "react";
import { CreateJiraFormContext } from "./context";

export const useCreateJiraForm = () => {
  const context = useContext(CreateJiraFormContext);
  if (!context) {
    throw new Error("useCreateJiraForm must be used within CreateJiraFormProvider");
  }
  return context;
};
