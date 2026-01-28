import { useContext } from "react";
import { ManageJiraServerFormContext } from "./context";

export const useManageJiraServerForm = () => {
  const context = useContext(ManageJiraServerFormContext);
  if (!context) {
    throw new Error("useManageJiraServerForm must be used within ManageJiraServerFormProvider");
  }
  return context;
};
